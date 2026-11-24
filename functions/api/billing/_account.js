// Billing side of account termination (DELETE /api/me), so a deleted account
// is never left with a running Stripe subscription.

import { ENTITLED_STATUSES } from './_config';
import { stripeRequest, subscriptionPeriodEnd } from './_stripe';

/**
 * timing 'now'          → cancels the Stripe subscription immediately.
 * timing 'end_of_cycle' → stops renewal; the plan runs to the end of the paid period.
 * Returns { periodEnd: Date|null }. Throws if Stripe refuses, so the caller can
 * stop before deleting anything.
 */
export async function cancelStripeSubscriptionForAccount(env, sub, timing) {
  if (!sub?.stripeSubscriptionId || !ENTITLED_STATUSES.has(sub.billingStatus)) return { periodEnd: null };

  const path = `/subscriptions/${encodeURIComponent(sub.stripeSubscriptionId)}`;
  if (timing === 'now') {
    await stripeRequest(env, 'DELETE', path);
    return { periodEnd: null };
  }
  const updated = await stripeRequest(env, 'POST', path, { cancel_at_period_end: true });
  const end = subscriptionPeriodEnd(updated);
  return { periodEnd: end ? new Date(end * 1000) : null };
}
