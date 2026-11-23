import { eq } from 'drizzle-orm';
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
 * Moves an expired paid plan back to the free plan, lazily: every endpoint that
 * reads a subscription calls this first, so the downgrade happens the next time
 * the user (or an app acting for them) touches Moshly. Usage counters are kept.
 * Returns the subscription as it is after the check.
 */
export async function settleSubscription(db, subscription) {
  if (!isPlanExpired(subscription)) return subscription;

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
