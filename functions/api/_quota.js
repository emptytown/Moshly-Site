// Moshly quotas: the one place that knows how usage is counted.
//
// Used by the internal API for the apps (api/internal/quota/*), by the
// user-facing GET /api/quota, and by any feature that runs inside this site
// (e.g. a future AI feature for Days). Usage resets on the 1st of every month
// (UTC) — see resetUsageIfNewPeriod() in _subscription.js.
import { drizzle } from 'drizzle-orm/d1';
import { eq, sql, and } from 'drizzle-orm';
import * as schema from '../db/schema';
import { settleSubscription, nextUsagePeriodStart } from './_subscription';

// Resource registry. To add one (e.g. csv_exports): add the two columns to
// `subscriptions` (schema.ts + a migration), the limits to _plans.js, and an
// entry here. Nothing changes in the apps beyond the resource name they send.
export const QUOTA_RESOURCES = {
  ai_credits: {
    usedKey:    'aiCreditsUsed',
    limitKey:   'aiCreditsLimit',
    usedCol:    schema.subscriptions.aiCreditsUsed,
    limitCol:   schema.subscriptions.aiCreditsLimit,
    maxPerCall: 50,
  },
  pdf_exports: {
    usedKey:    'pdfExportsUsed',
    limitKey:   'pdfExportsLimit',
    usedCol:    schema.subscriptions.pdfExportsUsed,
    limitCol:   schema.subscriptions.pdfExportsLimit,
    maxPerCall: 1,
  },
};

export function isQuotaResource(resource) {
  return Object.prototype.hasOwnProperty.call(QUOTA_RESOURCES, resource);
}

/** The user's workspace subscription, settled (expiry + monthly reset), or null. */
export async function loadSubscriptionForUser(db, userId) {
  const row = await db
    .select({ subscription: schema.subscriptions })
    .from(schema.workspaces)
    .leftJoin(schema.subscriptions, eq(schema.subscriptions.workspaceId, schema.workspaces.id))
    .where(eq(schema.workspaces.ownerId, userId))
    .get();
  if (!row || !row.subscription) return null;
  return settleSubscription(db, row.subscription);
}

/** { resource, used, limit, remaining, resetsAt } for one resource. */
export function quotaSnapshot(subscription, resource, now = new Date()) {
  const config = QUOTA_RESOURCES[resource];
  const used  = Number(subscription[config.usedKey]  ?? 0);
  const limit = Number(subscription[config.limitKey] ?? 0);
  return {
    resource,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    resetsAt: nextUsagePeriodStart(now).toISOString(),
  };
}

export function allQuotaSnapshots(subscription, now = new Date()) {
  return Object.fromEntries(
    Object.keys(QUOTA_RESOURCES).map((r) => [r, quotaSnapshot(subscription, r, now)])
  );
}

function validAmount(resource, amount) {
  const { maxPerCall } = QUOTA_RESOURCES[resource];
  return Number.isInteger(amount) && amount >= 1 && amount <= maxPerCall;
}

/**
 * Spends `amount` of `resource`. Never goes over the limit: the increment is
 * conditional in SQL, so two concurrent calls cannot both pass the check.
 *
 * Returns { ok: true, ...snapshot } or { ok: false, status, error, ...details }.
 * `insufficient_credits` (402) is the refusal for every resource, PDFs included.
 */
export async function consumeQuota(db, userId, resource, amount = 1) {
  if (!isQuotaResource(resource)) {
    return { ok: false, status: 400, error: 'unknown_resource', knownResources: Object.keys(QUOTA_RESOURCES) };
  }
  if (!validAmount(resource, amount)) {
    return { ok: false, status: 400, error: 'invalid_amount', max: QUOTA_RESOURCES[resource].maxPerCall };
  }

  const subscription = await loadSubscriptionForUser(db, userId);
  if (!subscription) return { ok: false, status: 404, error: 'no_subscription' };

  const config = QUOTA_RESOURCES[resource];
  const updated = await db
    .update(schema.subscriptions)
    .set({ [config.usedKey]: sql`${config.usedCol} + ${amount}` })
    .where(and(
      eq(schema.subscriptions.workspaceId, subscription.workspaceId),
      sql`${config.usedCol} + ${amount} <= ${config.limitCol}`,
    ))
    .returning()
    .get();

  if (!updated) {
    return { ok: false, status: 402, error: 'insufficient_credits', ...quotaSnapshot(subscription, resource) };
  }
  return { ok: true, ...quotaSnapshot(updated, resource) };
}

/**
 * Gives back `amount` of `resource` after the work it paid for failed
 * (the AI provider errored, the PDF could not be built). Never below zero.
 */
export async function refundQuota(db, userId, resource, amount = 1) {
  if (!isQuotaResource(resource)) {
    return { ok: false, status: 400, error: 'unknown_resource', knownResources: Object.keys(QUOTA_RESOURCES) };
  }
  if (!validAmount(resource, amount)) {
    return { ok: false, status: 400, error: 'invalid_amount', max: QUOTA_RESOURCES[resource].maxPerCall };
  }

  const subscription = await loadSubscriptionForUser(db, userId);
  if (!subscription) return { ok: false, status: 404, error: 'no_subscription' };

  const config = QUOTA_RESOURCES[resource];
  const updated = await db
    .update(schema.subscriptions)
    .set({ [config.usedKey]: sql`max(0, ${config.usedCol} - ${amount})` })
    .where(eq(schema.subscriptions.workspaceId, subscription.workspaceId))
    .returning()
    .get();

  return { ok: true, ...quotaSnapshot(updated ?? subscription, resource) };
}

export function quotaDb(env) {
  return drizzle(env.MOSHLY_DB);
}
