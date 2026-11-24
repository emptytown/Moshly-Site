// Provider-neutral plan state. Every payment processor (Stripe now, Apple in-app
// purchases later) ends here: it works out { plan, status, interval, paidUntil }
// and the workspace's subscription row is updated with the matching limits.

import { eq } from 'drizzle-orm';
import * as schema from '../../db/schema';
import { PLAN_LIMITS } from '../_plans';
import { ENTITLED_STATUSES, EXPIRY_GRACE_DAYS, planForPriceId } from './_config';
import { stripeRequest, subscriptionPeriodEnd } from './_stripe';

const DAY_MS = 24 * 60 * 60 * 1000;

export function paidPlanFields({ plan, provider, status, interval, paidUntil, cancelAtPeriodEnd }) {
  const limits = PLAN_LIMITS[plan];
  return {
    plan,
    pdfExportsLimit: limits.pdfExportsLimit,
    aiCreditsLimit: limits.aiCreditsLimit,
    expiresAt: paidUntil,
    billingProvider: provider,
    billingStatus: status,
    billingInterval: interval,
    cancelAtPeriodEnd: Boolean(cancelAtPeriodEnd),
    billingUpdatedAt: new Date(),
  };
}

/** Back to Free. Processor IDs are kept so the customer can resubscribe. */
export function freePlanFields(status = null) {
  const limits = PLAN_LIMITS.free;
  return {
    plan: 'free',
    pdfExportsLimit: limits.pdfExportsLimit,
    aiCreditsLimit: limits.aiCreditsLimit,
    expiresAt: null,
    billingStatus: status,
    billingInterval: null,
    cancelAtPeriodEnd: false,
    billingUpdatedAt: new Date(),
  };
}

export async function getSubscriptionRow(db, workspaceId) {
  return db.select().from(schema.subscriptions).where(eq(schema.subscriptions.workspaceId, workspaceId)).get();
}

async function findWorkspaceIdForStripe(db, { workspaceId, subscriptionId, customerId }) {
  if (workspaceId) return workspaceId;
  if (subscriptionId) {
    const row = await db.select({ id: schema.subscriptions.workspaceId }).from(schema.subscriptions)
      .where(eq(schema.subscriptions.stripeSubscriptionId, subscriptionId)).get();
    if (row) return row.id;
  }
  if (customerId) {
    const row = await db.select({ id: schema.subscriptions.workspaceId }).from(schema.subscriptions)
      .where(eq(schema.subscriptions.stripeCustomerId, customerId)).get();
    if (row) return row.id;
  }
  return null;
}

/**
 * Works out the Moshly plan fields for a Stripe subscription object.
 * Pure function, so it can be unit-tested without Stripe or D1.
 * Returns { ignore: reason } when the subscription must not change the plan.
 */
export function planFieldsFromStripeSubscription(sub, row) {
  const price = sub.items?.data?.[0]?.price?.id;
  const mapped = planForPriceId(price);
  if (!mapped) return { ignore: `unknown_price:${price}` };

  // An older subscription finishing must not downgrade a newer paid one.
  const rowEntitled = row && row.plan !== 'free' && ENTITLED_STATUSES.has(row.billingStatus);
  if (rowEntitled && row.stripeSubscriptionId && row.stripeSubscriptionId !== sub.id && !ENTITLED_STATUSES.has(sub.status)) {
    return { ignore: 'stale_subscription' };
  }

  if (sub.status === 'incomplete') {
    // First payment not done yet: no plan change, just remember the IDs.
    return { fields: {} };
  }

  if (ENTITLED_STATUSES.has(sub.status)) {
    const endSeconds = sub.status === 'trialing' && sub.trial_end ? sub.trial_end : subscriptionPeriodEnd(sub);
    const fields = paidPlanFields({
      plan: mapped.plan,
      provider: 'stripe',
      status: sub.status,
      interval: mapped.interval,
      paidUntil: endSeconds ? new Date(endSeconds * 1000) : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end || Boolean(sub.cancel_at),
    });
    if (sub.trial_end && !row?.trialUsedAt) fields.trialUsedAt = new Date(sub.trial_start ? sub.trial_start * 1000 : Date.now());
    return { fields };
  }

  // canceled, unpaid, incomplete_expired, paused → Free.
  return { fields: { ...freePlanFields(sub.status), billingProvider: 'stripe' } };
}

/**
 * Fetches the subscription from Stripe (so event order does not matter) and
 * writes the resulting plan to the workspace. Idempotent.
 */
export async function syncStripeSubscription(env, db, subscriptionId, { workspaceId: hint } = {}) {
  const sub = await stripeRequest(env, 'GET', `/subscriptions/${encodeURIComponent(subscriptionId)}`);
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;

  const workspaceId = await findWorkspaceIdForStripe(db, {
    workspaceId: sub.metadata?.workspace_id || hint,
    subscriptionId: sub.id,
    customerId,
  });
  if (!workspaceId) return { ignored: 'no_workspace', subscriptionId };

  const row = await getSubscriptionRow(db, workspaceId);
  if (!row) return { ignored: 'no_subscription_row', workspaceId };
  if (row.stripeCustomerId && customerId && row.stripeCustomerId !== customerId) {
    console.error('[billing] customer mismatch', { workspaceId, expected: row.stripeCustomerId, got: customerId });
    return { ignored: 'customer_mismatch', workspaceId };
  }

  const result = planFieldsFromStripeSubscription(sub, row);
  if (result.ignore) {
    console.warn('[billing] subscription ignored', { workspaceId, subscriptionId: sub.id, reason: result.ignore });
    return { ignored: result.ignore, workspaceId };
  }

  const update = {
    ...result.fields,
    stripeCustomerId: row.stripeCustomerId || customerId,
    stripeSubscriptionId: sub.id,
  };
  if (!update.billingProvider) update.billingProvider = 'stripe';
  await db.update(schema.subscriptions).set(update).where(eq(schema.subscriptions.workspaceId, workspaceId));
  console.info('[billing] synced', { workspaceId, subscriptionId: sub.id, status: sub.status, plan: update.plan ?? row.plan });
  return { workspaceId, status: sub.status, plan: update.plan ?? row.plan };
}

/**
 * Lazy expiry, run whenever a plan is read (/api/me, internal quota endpoints).
 * Pages Functions have no cron, and processor webhooks already handle normal
 * renewals and cancellations; this catches what they cannot:
 *  - invite-code plans whose time is up → Free;
 *  - a Stripe period that ended without a webhook → re-check with Stripe, and
 *    fall back to Free after EXPIRY_GRACE_DAYS if Stripe cannot confirm it.
 * Returns the (possibly updated) subscription row.
 */
export async function enforceExpiry(env, db, sub, now = new Date()) {
  if (!sub || sub.plan === 'free' || !sub.expiresAt) return sub;
  const expiresAt = new Date(sub.expiresAt);
  if (expiresAt > now) return sub;

  if (sub.billingProvider === 'stripe' && sub.stripeSubscriptionId && env.STRIPE_SECRET_KEY) {
    try {
      await syncStripeSubscription(env, db, sub.stripeSubscriptionId, { workspaceId: sub.workspaceId });
      const fresh = await getSubscriptionRow(db, sub.workspaceId);
      if (!fresh || fresh.plan === 'free' || !fresh.expiresAt || new Date(fresh.expiresAt) > now) return fresh;
      sub = fresh;
    } catch (err) {
      console.error('[billing] expiry re-check failed', { workspaceId: sub.workspaceId, error: err.message });
    }
  }

  const graceMs = sub.billingProvider ? EXPIRY_GRACE_DAYS * DAY_MS : 0;
  if (now.getTime() - expiresAt.getTime() < graceMs) return sub;

  const fields = freePlanFields(sub.billingProvider ? 'expired' : null);
  await db.update(schema.subscriptions).set(fields).where(eq(schema.subscriptions.workspaceId, sub.workspaceId));
  console.info('[billing] plan expired → free', { workspaceId: sub.workspaceId, plan: sub.plan, provider: sub.billingProvider });
  return { ...sub, ...fields };
}

/** Billing fields that are safe to show the signed-in user. */
export function publicBillingFields(sub) {
  if (!sub) return null;
  return {
    billingProvider: sub.billingProvider || null,
    billingStatus: sub.billingStatus || null,
    billingInterval: sub.billingInterval || null,
    cancelAtPeriodEnd: Boolean(sub.cancelAtPeriodEnd),
    hasBillingAccount: Boolean(sub.stripeCustomerId),
    trialUsed: Boolean(sub.trialUsedAt),
  };
}
