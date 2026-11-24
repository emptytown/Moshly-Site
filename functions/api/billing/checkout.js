// POST /api/billing/checkout  { plan: 'solo'|'collective', interval: 'month'|'year' }
// Creates a Stripe Checkout Session (subscription mode) for the signed-in user's
// workspace and returns { url } to redirect to. The plan is only granted later,
// by the webhook, once Stripe confirms payment.

import { drizzle } from 'drizzle-orm/d1';
import { and, eq, isNull } from 'drizzle-orm';
import * as schema from '../../db/schema';
import { verifyJWT } from '../_middleware_auth';
import { corsOptionsResponse } from '../_cors';
import { applyRateLimit, rateLimitedResponse } from '../_rate-limit';
import {
  BILLING_INTERVALS, ENTITLED_STATUSES, SELLABLE_PLANS, TRIAL_DAYS, priceIdFor, stripeMode,
} from './_config';
import { StripeError, stripeRequest } from './_stripe';
import { json, loadOwnerWorkspace, siteOrigin } from './_shared';

export async function onRequestPost({ request, env }) {
  const payload = await verifyJWT(request, env);
  if (!payload) return json(request, { error: 'unauthorized', message: 'Unauthorized' }, 401);

  const retryAfter = await applyRateLimit(env.AUTH_KV, 'billing', `user:${payload.userId}`);
  if (retryAfter) return rateLimitedResponse(retryAfter);

  let body;
  try { body = await request.json(); } catch { body = null; }
  const plan = body?.plan;
  const interval = body?.interval;
  if (!SELLABLE_PLANS.includes(plan) || !BILLING_INTERVALS.includes(interval)) {
    return json(request, { error: 'invalid_plan', message: 'Choose Solo or Collective, monthly or yearly.' }, 400);
  }

  const mode = stripeMode(env);
  const priceId = mode && priceIdFor(mode, plan, interval);
  if (!priceId) {
    return json(request, { error: 'billing_not_configured', message: 'Payments are not available yet.' }, 503);
  }

  const db = drizzle(env.MOSHLY_DB);
  try {
    const row = await loadOwnerWorkspace(db, payload.userId);
    if (!row?.workspace || !row.subscription) {
      return json(request, { error: 'no_workspace', message: 'No workspace found for this account.' }, 404);
    }
    const { user, workspace, subscription: sub } = row;

    if (sub.billingProvider === 'apple' && ENTITLED_STATUSES.has(sub.billingStatus)) {
      return json(request, { error: 'managed_elsewhere', message: 'This plan is managed in the App Store.' }, 409);
    }
    if (sub.stripeSubscriptionId && ENTITLED_STATUSES.has(sub.billingStatus)) {
      return json(request, {
        error: 'already_subscribed',
        message: 'You already have a subscription. Change or cancel it in the billing portal.',
      }, 409);
    }

    // One Stripe customer per workspace, created on first checkout.
    let customerId = sub.stripeCustomerId;
    if (!customerId) {
      const customer = await stripeRequest(env, 'POST', '/customers', {
        email: user.email,
        name: user.name || undefined,
        metadata: { workspace_id: workspace.id, user_id: user.id },
      }, { idempotencyKey: `customer-${workspace.id}` });
      customerId = customer.id;
      await db.update(schema.subscriptions)
        .set({ stripeCustomerId: customerId })
        .where(and(eq(schema.subscriptions.workspaceId, workspace.id), isNull(schema.subscriptions.stripeCustomerId)));
      const saved = await db.select({ id: schema.subscriptions.stripeCustomerId }).from(schema.subscriptions)
        .where(eq(schema.subscriptions.workspaceId, workspace.id)).get();
      customerId = saved?.id || customerId;
    }

    const origin = siteOrigin(request);
    const trialDays = TRIAL_DAYS[plan] || 0;
    const subscriptionData = { metadata: { workspace_id: workspace.id, plan, interval } };
    if (trialDays > 0 && !sub.trialUsedAt) subscriptionData.trial_period_days = trialDays;

    const session = await stripeRequest(env, 'POST', '/checkout/sessions', {
      mode: 'subscription',
      customer: customerId,
      client_reference_id: workspace.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?billing=success#subscription`,
      cancel_url: `${origin}/dashboard?billing=cancelled#subscription`,
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true },
      billing_address_collection: 'required',
      customer_update: { address: 'auto', name: 'auto' },
      locale: 'auto',
      metadata: { workspace_id: workspace.id, plan, interval },
      subscription_data: subscriptionData,
    });

    console.info('[billing] checkout created', { workspaceId: workspace.id, plan, interval, mode });
    return json(request, { url: session.url });
  } catch (err) {
    console.error('[billing] checkout failed', { userId: payload.userId, error: err.message, code: err.code });
    const status = err instanceof StripeError && err.status === 503 ? 503 : 502;
    return json(request, { error: 'checkout_failed', message: 'Could not start checkout. Please try again.' }, status);
  }
}

export const onRequestOptions = ({ request }) => corsOptionsResponse(request, 'POST, OPTIONS');
