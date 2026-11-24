// Billing configuration. Price IDs are not secrets; the API keys are
// (STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET, Cloudflare secrets only).
//
// The plan itself always lives in the Moshly database (subscriptions table).
// Limits come from ../_plans.js; this file only maps plans to processor prices.

// Pinned so Stripe response shapes do not change under us. In this version the
// billing period sits on subscription items (items.data[].current_period_end).
export const STRIPE_API_VERSION = '2025-03-31.basil';

// Plans on sale. Business and Major exist in _plans.js but are not sold yet.
export const SELLABLE_PLANS = ['solo', 'collective'];
export const BILLING_INTERVALS = ['month', 'year'];

// Stripe price IDs per mode. Test = "Moshly Test" sandbox. Live IDs are filled in
// only after the live products exist and the owner has approved going live.
export const STRIPE_PRICES = {
  test: {
    solo:       { month: 'price_1UfGnw1WY7C3e0ny1STaPJKq', year: 'price_1UfGnw1WY7C3e0nyy2nMdGLR' },
    collective: { month: 'price_1UfGr21WY7C3e0nyE4PAc4lF', year: 'price_1UfGt81WY7C3e0nylHe4ZuEQ' },
  },
  live: {
    solo:       { month: null, year: null },
    collective: { month: null, year: null },
  },
};

// Free trial length per plan, in days. 0 = no trial. A 14-day Solo trial is
// supported by the code (one per workspace) but stays off until the terms and
// pricing page describe it.
export const TRIAL_DAYS = { solo: 0, collective: 0 };

// If a paid plan's period has ended and the processor cannot confirm a renewal,
// keep the plan this long before falling back to Free (covers webhook delays).
export const EXPIRY_GRACE_DAYS = 3;

// Statuses in which the customer keeps the paid plan.
// past_due: a renewal payment failed and Stripe is retrying it.
export const ENTITLED_STATUSES = new Set(['active', 'trialing', 'past_due']);

/** 'test' | 'live' | null, from the secret key prefix. */
export function stripeMode(env) {
  const key = env?.STRIPE_SECRET_KEY || '';
  if (/^(sk|rk)_test_/.test(key)) return 'test';
  if (/^(sk|rk)_live_/.test(key)) return 'live';
  return null;
}

export function priceIdFor(mode, plan, interval) {
  return STRIPE_PRICES[mode]?.[plan]?.[interval] || null;
}

/** Reverse lookup: price ID → { plan, interval }, or null if unknown. */
export function planForPriceId(priceId) {
  if (!priceId) return null;
  for (const prices of Object.values(STRIPE_PRICES)) {
    for (const [plan, intervals] of Object.entries(prices)) {
      for (const [interval, id] of Object.entries(intervals)) {
        if (id && id === priceId) return { plan, interval };
      }
    }
  }
  return null;
}
