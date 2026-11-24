# Billing (Stripe)

Moshly sells two plans through Stripe subscriptions: **Solo** (€4.99/month or €49.99/year) and **Collective** (€9.99/month or €99.99/year). Prices include VAT. Limits come from `functions/api/_plans.js`. Business and Major exist there but are not on sale.

The plan always lives in the Moshly database (`subscriptions` row of the workspace). Stripe only feeds it through webhooks. A future processor (Apple in-app purchases for the iOS app) will feed the same fields.

## Flow

```
Dashboard "Plan and billing" ──POST /api/billing/checkout──▶ Stripe Checkout
                                                                 │ pays
Stripe ──POST /api/billing/webhook (signed)──▶ re-reads the subscription from Stripe
                                               └▶ subscriptions row: plan, limits, status, period, paid until
Dashboard "Manage billing" ──POST /api/billing/portal──▶ Stripe customer portal
                                                         (card, invoices, switch plan, cancel at period end)
```

| Endpoint | Auth | What it does |
|---|---|---|
| `POST /api/billing/checkout` `{plan, interval}` | RS256 user JWT | Creates the Stripe customer (once per workspace) and a Checkout Session in subscription mode, with automatic tax and VAT number collection. Returns `{url}`. Refuses (409) if the workspace already has a live subscription. |
| `POST /api/billing/portal` `{flow?}` | RS256 user JWT | Opens the customer portal. `flow: 'cancel'` or `'update'` jumps straight to cancelling or switching plan. Returns `{url}`. |
| `POST /api/billing/webhook` | Stripe signature | Verifies `Stripe-Signature`, refuses test events on a live key and vice versa, applies each event once (`billing_events`), and re-reads the subscription from Stripe so event order does not matter. |

Webhook events to enable on the endpoint: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`.

## Data (`drizzle/migrations/0007_billing.sql`)

On `subscriptions`:

| Column | Meaning |
|---|---|
| `expires_at` | **Paid until.** End of the current billing period (or trial). NULL for Free and eternal invite plans. |
| `billing_provider` | `stripe`, later `apple`. NULL for Free or invite-code plans. |
| `billing_status` | Stripe status: `active`, `trialing`, `past_due`, `canceled`, `unpaid`, `incomplete`, `paused`, or `expired` (set by the lazy check). |
| `billing_interval` | `month` or `year`. |
| `cancel_at_period_end` | 1 when the customer cancelled; the plan runs to `expires_at`. |
| `stripe_customer_id`, `stripe_subscription_id` | Stripe IDs (customer is unique). |
| `trial_used_at` | Set the first time a trial starts, so a workspace gets one trial only. |
| `app_changed_at` | Was read by `me.js` but never created; added here. |

New table `billing_events` (processed webhook event IDs).

## Plan rules

| Stripe status | Moshly plan |
|---|---|
| `active`, `trialing` | The paid plan, `expires_at` = end of the period or trial. |
| `past_due` (renewal failed, Stripe retrying) | Keeps the paid plan; the dashboard asks to update the card. |
| `canceled`, `unpaid`, `incomplete_expired`, `paused` | Free. |
| `incomplete` (first payment not done) | No change. |
| cancel at period end | Keeps the plan until `expires_at`, then Stripe sends `customer.subscription.deleted` → Free. Same as the terms (section 4). |

Switching plans happens in the portal, with Stripe's proration. Upgrades take effect at once; downgrades at the end of the period (portal setting).

## Expiry (why lazy, not cron)

Pages Functions have no Cron Triggers; a cron would need a separate Worker deployed next to the site. Webhooks already handle every normal renewal and cancellation, so the extra check only has to catch what they cannot. `enforceExpiry` runs whenever a plan is read (`GET /api/me` and the internal `quota/balance` and `quota/consume` endpoints that Quote, Rank and the other apps call):

- **Invite-code plans** past `expires_at` → Free at once. Before this change nothing ever expired them.
- **Stripe plans** past `expires_at` → the subscription is re-read from Stripe first. If Stripe confirms a renewal, the plan stays. If Stripe cannot confirm it, the plan falls to Free after `EXPIRY_GRACE_DAYS` (3).

A plan that nobody reads stays "paid" in the database until someone reads it, but nobody can use it in between, so this is safe.

## Account deletion

`DELETE /api/me` cancels the Stripe subscription first (immediately for "now", at period end for "end of cycle"). If Stripe refuses, the account is not deleted, so nobody is left paying for a deleted account. Refunds stay manual, as in the terms.

## Configuration

Price IDs are in `functions/api/billing/_config.js` (`STRIPE_PRICES.test` = "Moshly Test" sandbox; `live` stays empty until go-live). The secret key prefix (`sk_test_` / `sk_live_`) decides which set is used.

Cloudflare Pages secrets (never in code or `wrangler.toml`):

| Secret | Preview | Production |
|---|---|---|
| `STRIPE_SECRET_KEY` | sandbox `sk_test_…` | `sk_live_…`, only after the owner's explicit yes |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` of the sandbox endpoint | `whsec_…` of the live endpoint |

Without these, the endpoints answer 503 `billing_not_configured` and nothing is charged.

### Trial

`TRIAL_DAYS` in `_config.js` supports a free trial (one per workspace, card required at checkout). It is **0** until the terms and the pricing page describe the trial.

## Tests

`npm run test:billing` applies the migrations to the local D1 and runs `tests/billing/billing.test.js`: signature checks, plan mapping, and webhook flows (subscribe → renew → payment fails → upgrade → cancel → back to Free), duplicate events, test/live mix-ups, and lazy expiry. Stripe is replaced by an in-memory fake; nothing talks to Stripe or production.

End-to-end test in the sandbox (before any live payment): subscribe with card `4242 4242 4242 4242`, advance a test clock to renew, fail a renewal with card `4000 0000 0000 0341`, and cancel in the portal.

## Not done here (check with the accountant)

- AT-certified invoices (Portugal). Stripe invoices are not AT-certified.
- VAT OSS registration for the rest of the EU, and UK, Switzerland and Norway.
