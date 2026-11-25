import { eq, and, or, isNull, lt } from 'drizzle-orm';
import * as schema from '../db/schema';
import { PLAN_LIMITS } from './_plans.js';

/**
 * A paid plan with an end date (`expires_at`) in the past has run out:
 * a fixed-term plan given by an admin or an invite code, or an account whose
 * cancellation took effect.
 */
export function isPlanExpired(subscription, now = new Date()) {
  if (!subscription || !subscription.plan || subscription.plan === 'free') return false;
  if (!subscription.expiresAt) return false;
  return new Date(subscription.expiresAt).getTime() <= now.getTime();
}

/**
 * Usage periods are calendar months in UTC. Everyone's counters go back to
 * zero on the 1st at 00:00 UTC, whatever day they signed up or upgraded.
 */
export function usagePeriodStart(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export function nextUsagePeriodStart(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

function toMillis(value) {
  if (value == null) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value < 1e12 ? value * 1000 : value; // seconds or ms
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

async function moveExpiredPlanToFree(db, subscription) {
  const free = PLAN_LIMITS.free;
  const update = {
    plan: 'free',
    pdfExportsLimit: free.pdfExportsLimit,
    aiCreditsLimit: free.aiCreditsLimit,
    expiresAt: null,
  };
  await db
    .update(schema.subscriptions)
    .set(update)
    .where(eq(schema.subscriptions.workspaceId, subscription.workspaceId))
    .run();

  console.info('Plan expired, moved to free', {
    workspaceId: subscription.workspaceId,
    previousPlan: subscription.plan,
  });
  return { ...subscription, ...update };
}

/**
 * Starts a new usage period when the stored one is from an earlier month:
 * usage counters go back to zero. The UPDATE only applies if no other request
 * has reset this period already, and the row is read back afterwards, so
 * concurrent requests at the turn of the month never lose a debit.
 */
async function resetUsageIfNewPeriod(db, subscription, now) {
  const periodStart = usagePeriodStart(now);
  const stored = toMillis(subscription.usagePeriodStart);
  if (stored !== null && stored >= periodStart.getTime()) return subscription;

  const col = schema.subscriptions.usagePeriodStart;
  await db
    .update(schema.subscriptions)
    .set({ aiCreditsUsed: 0, pdfExportsUsed: 0, usagePeriodStart: periodStart })
    .where(and(
      eq(schema.subscriptions.workspaceId, subscription.workspaceId),
      or(isNull(col), lt(col, periodStart)),
    ))
    .run();

  const fresh = await db
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.workspaceId, subscription.workspaceId))
    .get();
  return fresh ? { ...subscription, ...fresh } : subscription;
}

/**
 * Brings a subscription up to date, lazily, every time it is read:
 * 1. an expired paid plan moves back to the free plan (usage counters kept);
 * 2. a new month starts a new usage period (usage counters back to zero).
 * Call it wherever a subscription is read. Returns the subscription as it is
 * after the checks.
 */
export async function settleSubscription(db, subscription, now = new Date()) {
  if (!subscription || !subscription.workspaceId) return subscription;
  let current = subscription;
  if (isPlanExpired(current, now)) current = await moveExpiredPlanToFree(db, current);
  return resetUsageIfNewPeriod(db, current, now);
}
