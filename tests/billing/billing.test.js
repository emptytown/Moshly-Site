// Billing tests: run with `npm run test:billing`.
// Unit tests for signatures and plan mapping, plus webhook → D1 flows against a
// local D1 (wrangler getPlatformProxy, migrations applied) with Stripe's API
// replaced by an in-memory fake. Nothing here talks to Stripe or production.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { getPlatformProxy } from 'wrangler';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '../../functions/db/schema';
import { PLAN_LIMITS } from '../../functions/api/_plans';
import { STRIPE_PRICES, planForPriceId, priceIdFor, stripeMode } from '../../functions/api/billing/_config';
import { encodeForm, invoiceSubscriptionId, subscriptionPeriodEnd, verifyStripeSignature } from '../../functions/api/billing/_stripe';
import { enforceExpiry, planFieldsFromStripeSubscription } from '../../functions/api/billing/_entitlements';
import { onRequestPost as webhook } from '../../functions/api/billing/webhook';

const SECRET = 'whsec_test_secret';
const PRICE = STRIPE_PRICES.test;
const DAY = 86400;
const now = () => Math.floor(Date.now() / 1000);

function sign(body, secret = SECRET, t = now()) {
  const v1 = createHmac('sha256', secret).update(`${t}.${body}`).digest('hex');
  return `t=${t},v1=${v1}`;
}

function stripeSub(overrides = {}) {
  const start = now();
  return {
    id: 'sub_1', object: 'subscription', customer: 'cus_1', status: 'active',
    cancel_at_period_end: false, cancel_at: null, trial_start: null, trial_end: null,
    metadata: { workspace_id: 'ws_1' },
    items: { data: [{ price: { id: PRICE.solo.month }, current_period_start: start, current_period_end: start + 30 * DAY }] },
    ...overrides,
  };
}

// ── Unit ─────────────────────────────────────────────────────────

test('signature: valid, wrong secret, tampered body, too old', async () => {
  const body = '{"id":"evt_1"}';
  assert.equal(await verifyStripeSignature(body, sign(body), SECRET), true);
  assert.equal(await verifyStripeSignature(body, sign(body, 'whsec_other'), SECRET), false);
  assert.equal(await verifyStripeSignature(body + ' ', sign(body), SECRET), false);
  assert.equal(await verifyStripeSignature(body, sign(body, SECRET, now() - 600), SECRET), false);
  assert.equal(await verifyStripeSignature(body, null, SECRET), false);
  const multi = `t=${now()},v1=deadbeef,${sign(body).split(',')[1]}`;
  assert.equal(await verifyStripeSignature(body, multi, SECRET), true);
});

test('config: mode from key prefix and price lookups', () => {
  assert.equal(stripeMode({ STRIPE_SECRET_KEY: 'sk_test_x' }), 'test');
  assert.equal(stripeMode({ STRIPE_SECRET_KEY: 'sk_live_x' }), 'live');
  assert.equal(stripeMode({}), null);
  assert.equal(priceIdFor('test', 'collective', 'year'), PRICE.collective.year);
  assert.equal(priceIdFor('live', 'solo', 'month'), null, 'live prices stay empty until go-live');
  assert.equal(priceIdFor('test', 'business', 'month'), null, 'business is not on sale');
  assert.deepEqual(planForPriceId(PRICE.solo.year), { plan: 'solo', interval: 'year' });
  assert.equal(planForPriceId('price_unknown'), null);
});

test('stripe helpers: form encoding, period end, invoice subscription', () => {
  const form = encodeForm({ line_items: [{ price: 'p', quantity: 1 }], automatic_tax: { enabled: true }, skip: null });
  assert.equal(form.toString(), 'line_items%5B0%5D%5Bprice%5D=p&line_items%5B0%5D%5Bquantity%5D=1&automatic_tax%5Benabled%5D=true');
  assert.equal(subscriptionPeriodEnd({ current_period_end: 5 }), 5);
  assert.equal(subscriptionPeriodEnd({ items: { data: [{ current_period_end: 9 }] }, current_period_end: 5 }), 9);
  assert.equal(invoiceSubscriptionId({ parent: { subscription_details: { subscription: 'sub_new' } } }), 'sub_new');
  assert.equal(invoiceSubscriptionId({ subscription: 'sub_old' }), 'sub_old');
});

test('plan mapping: statuses', () => {
  const active = planFieldsFromStripeSubscription(stripeSub(), null).fields;
  assert.equal(active.plan, 'solo');
  assert.equal(active.billingInterval, 'month');
  assert.equal(active.aiCreditsLimit, PLAN_LIMITS.solo.aiCreditsLimit);
  assert.equal(active.pdfExportsLimit, PLAN_LIMITS.solo.pdfExportsLimit);

  const pastDue = planFieldsFromStripeSubscription(stripeSub({ status: 'past_due' }), null).fields;
  assert.equal(pastDue.plan, 'solo', 'past_due keeps the plan while Stripe retries');

  const trial = planFieldsFromStripeSubscription(stripeSub({ status: 'trialing', trial_start: now(), trial_end: now() + 14 * DAY }), null).fields;
  assert.equal(trial.expiresAt.getTime(), (now() + 14 * DAY) * 1000);
  assert.ok(trial.trialUsedAt);

  for (const status of ['canceled', 'unpaid', 'incomplete_expired', 'paused']) {
    assert.equal(planFieldsFromStripeSubscription(stripeSub({ status }), null).fields.plan, 'free', status);
  }
  assert.deepEqual(planFieldsFromStripeSubscription(stripeSub({ status: 'incomplete' }), null).fields, {});
  assert.match(planFieldsFromStripeSubscription(stripeSub({ items: { data: [{ price: { id: 'price_x' } }] } }), null).ignore, /unknown_price/);

  const newer = { plan: 'collective', billingStatus: 'active', stripeSubscriptionId: 'sub_2' };
  assert.equal(planFieldsFromStripeSubscription(stripeSub({ status: 'canceled' }), newer).ignore, 'stale_subscription');
});

// ── Webhook + D1 ─────────────────────────────────────────────────

let proxy;
let env;
let db;
const stripeState = new Map(); // subscription id → object returned by the fake API
const realFetch = globalThis.fetch;

before(async () => {
  proxy = await getPlatformProxy({ persist: { path: '.wrangler/state/v3' } });
  db = drizzle(proxy.env.MOSHLY_DB);
  env = { ...proxy.env, STRIPE_SECRET_KEY: 'sk_test_fake', STRIPE_WEBHOOK_SECRET: SECRET };
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    if (!u.startsWith('https://api.stripe.com/')) return realFetch(url, init);
    const id = decodeURIComponent(u.split('/subscriptions/')[1] || '');
    const sub = stripeState.get(id);
    return new Response(JSON.stringify(sub || { error: { message: 'No such subscription' } }), { status: sub ? 200 : 404 });
  };
});

after(async () => {
  globalThis.fetch = realFetch;
  await proxy?.dispose();
});

async function seedWorkspace(id, sub = {}) {
  // Raw SQL: the repo's migrations predate some production user columns (e.g. email_verified).
  await proxy.env.MOSHLY_DB.prepare('INSERT OR IGNORE INTO users (id, email, password_hash) VALUES (?, ?, ?)')
    .bind(`u_${id}`, `${id}@example.test`, 'x').run();
  await db.insert(schema.workspaces).values({ id, ownerId: `u_${id}`, name: id, slug: id }).onConflictDoNothing();
  await db.delete(schema.subscriptions).where(eq(schema.subscriptions.workspaceId, id));
  await db.insert(schema.subscriptions).values({ workspaceId: id, plan: 'free', ...sub });
}

const row = (id) => db.select().from(schema.subscriptions).where(eq(schema.subscriptions.workspaceId, id)).get();

async function deliver(event) {
  const body = JSON.stringify({ livemode: false, ...event });
  const request = new Request('https://moshly.test/api/billing/webhook', {
    method: 'POST', body, headers: { 'Stripe-Signature': sign(body) },
  });
  return webhook({ request, env });
}

test('webhook: subscribe → renew → payment fails → cancel at period end → ends', async () => {
  const ws = `ws_flow_${Date.now()}`;
  await seedWorkspace(ws);
  let sub = stripeSub({ id: `sub_${ws}`, customer: `cus_${ws}`, metadata: { workspace_id: ws } });
  stripeState.set(sub.id, sub);

  // 1. Subscribe (Checkout completed)
  let res = await deliver({
    id: `evt_${ws}_1`, type: 'checkout.session.completed',
    data: { object: { mode: 'subscription', client_reference_id: ws, customer: sub.customer, subscription: sub.id } },
  });
  assert.equal(res.status, 200);
  let r = await row(ws);
  assert.equal(r.plan, 'solo');
  assert.equal(r.billingStatus, 'active');
  assert.equal(r.billingInterval, 'month');
  assert.equal(r.stripeCustomerId, sub.customer);
  assert.equal(r.aiCreditsLimit, PLAN_LIMITS.solo.aiCreditsLimit);
  const firstEnd = r.expiresAt.getTime();

  // Same event again → no-op
  res = await deliver({ id: `evt_${ws}_1`, type: 'checkout.session.completed', data: { object: {} } });
  assert.equal((await res.json()).duplicate, true);

  // 2. Renewal: Stripe moves the period on
  sub = { ...sub, items: { data: [{ ...sub.items.data[0], current_period_end: sub.items.data[0].current_period_end + 30 * DAY }] } };
  stripeState.set(sub.id, sub);
  await deliver({ id: `evt_${ws}_2`, type: 'invoice.paid', data: { object: { parent: { subscription_details: { subscription: sub.id } } } } });
  r = await row(ws);
  assert.equal(r.expiresAt.getTime(), firstEnd + 30 * DAY * 1000, 'paid-until moved by one period');

  // 3. Payment fails: past_due keeps the plan
  stripeState.set(sub.id, { ...sub, status: 'past_due' });
  await deliver({ id: `evt_${ws}_3`, type: 'invoice.payment_failed', data: { object: { subscription: sub.id } } });
  r = await row(ws);
  assert.equal(r.plan, 'solo');
  assert.equal(r.billingStatus, 'past_due');

  // 4. Upgrade to Collective yearly in the portal
  sub = { ...sub, status: 'active', items: { data: [{ ...sub.items.data[0], price: { id: PRICE.collective.year } }] } };
  stripeState.set(sub.id, sub);
  await deliver({ id: `evt_${ws}_4`, type: 'customer.subscription.updated', data: { object: sub } });
  r = await row(ws);
  assert.equal(r.plan, 'collective');
  assert.equal(r.billingInterval, 'year');
  assert.equal(r.aiCreditsLimit, PLAN_LIMITS.collective.aiCreditsLimit);

  // 5. Cancel: plan stays until the end of the paid period
  sub = { ...sub, cancel_at_period_end: true };
  stripeState.set(sub.id, sub);
  await deliver({ id: `evt_${ws}_5`, type: 'customer.subscription.updated', data: { object: sub } });
  r = await row(ws);
  assert.equal(r.plan, 'collective');
  assert.equal(r.cancelAtPeriodEnd, true);

  // 6. Period ends: Stripe deletes the subscription → Free
  stripeState.set(sub.id, { ...sub, status: 'canceled' });
  await deliver({ id: `evt_${ws}_6`, type: 'customer.subscription.deleted', data: { object: { ...sub, status: 'canceled' } } });
  r = await row(ws);
  assert.equal(r.plan, 'free');
  assert.equal(r.billingStatus, 'canceled');
  assert.equal(r.aiCreditsLimit, PLAN_LIMITS.free.aiCreditsLimit);
  assert.equal(r.expiresAt, null);
});

test('webhook: rejects bad signatures and test/live mix-ups', async () => {
  const body = JSON.stringify({ id: 'evt_bad', type: 'invoice.paid', livemode: false, data: { object: {} } });
  let res = await webhook({ env, request: new Request('https://x/', { method: 'POST', body, headers: { 'Stripe-Signature': sign(body, 'whsec_wrong') } }) });
  assert.equal(res.status, 400);
  res = await deliver({ id: 'evt_live', type: 'invoice.paid', livemode: true, data: { object: {} } });
  assert.equal(res.status, 400);
  res = await webhook({ env: { ...env, STRIPE_WEBHOOK_SECRET: undefined }, request: new Request('https://x/', { method: 'POST', body }) });
  assert.equal(res.status, 503);
});

test('expiry: invite-code plan past its date falls back to Free', async () => {
  const ws = `ws_invite_${Date.now()}`;
  await seedWorkspace(ws, { plan: 'collective', aiCreditsLimit: 1250, expiresAt: new Date(Date.now() - 1000) });
  const result = await enforceExpiry(env, db, await row(ws));
  assert.equal(result.plan, 'free');
  assert.equal((await row(ws)).plan, 'free');
});

test('expiry: missed Stripe renewal is re-checked with Stripe before any downgrade', async () => {
  const ws = `ws_missed_${Date.now()}`;
  const sub = stripeSub({ id: `sub_${ws}`, customer: `cus_${ws}`, metadata: { workspace_id: ws } });
  stripeState.set(sub.id, sub);
  await seedWorkspace(ws, {
    plan: 'solo', billingProvider: 'stripe', billingStatus: 'active', stripeCustomerId: sub.customer,
    stripeSubscriptionId: sub.id, expiresAt: new Date(Date.now() - 1000),
  });
  const result = await enforceExpiry(env, db, await row(ws));
  assert.equal(result.plan, 'solo', 'Stripe says it renewed, so the plan stays');
  assert.ok(new Date(result.expiresAt) > new Date());

  // Stripe unreachable and the period ended long ago → Free after the grace period
  stripeState.delete(sub.id);
  await db.update(schema.subscriptions).set({ expiresAt: new Date(Date.now() - 10 * DAY * 1000) }).where(eq(schema.subscriptions.workspaceId, ws));
  const late = await enforceExpiry(env, db, await row(ws));
  assert.equal(late.plan, 'free');
});

test('expiry: active plans and Free are left alone', async () => {
  const ws = `ws_ok_${Date.now()}`;
  await seedWorkspace(ws, { plan: 'solo', expiresAt: new Date(Date.now() + DAY * 1000) });
  assert.equal((await enforceExpiry(env, db, await row(ws))).plan, 'solo');
  await seedWorkspace(ws, { plan: 'major', expiresAt: null });
  assert.equal((await enforceExpiry(env, db, await row(ws))).plan, 'major', 'eternal invite plans never expire');
});
