// POST /api/billing/webhook — Stripe → Moshly.
// Verifies the Stripe-Signature header, applies each event once (billing_events),
// and re-reads the subscription from Stripe so the order events arrive in does
// not matter. Returns 5xx on failure so Stripe retries.

import { drizzle } from 'drizzle-orm/d1';
import { and, eq, isNull } from 'drizzle-orm';
import * as schema from '../../db/schema';
import { stripeMode } from './_config';
import { invoiceSubscriptionId, verifyStripeSignature } from './_stripe';
import { syncStripeSubscription } from './_entitlements';

const respond = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export async function handleStripeEvent(env, db, event) {
  const obj = event.data?.object || {};
  switch (event.type) {
    case 'checkout.session.completed': {
      if (obj.mode !== 'subscription' || !obj.subscription) return { ignored: 'not_subscription' };
      const workspaceId = obj.client_reference_id || obj.metadata?.workspace_id;
      if (!workspaceId) return { ignored: 'no_workspace' };
      const customerId = typeof obj.customer === 'string' ? obj.customer : obj.customer?.id;
      if (customerId) {
        await db.update(schema.subscriptions)
          .set({ stripeCustomerId: customerId })
          .where(and(eq(schema.subscriptions.workspaceId, workspaceId), isNull(schema.subscriptions.stripeCustomerId)));
      }
      const subscriptionId = typeof obj.subscription === 'string' ? obj.subscription : obj.subscription.id;
      return syncStripeSubscription(env, db, subscriptionId, { workspaceId });
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      return syncStripeSubscription(env, db, obj.id, { workspaceId: obj.metadata?.workspace_id });
    case 'invoice.paid':
    case 'invoice.payment_failed': {
      const subscriptionId = invoiceSubscriptionId(obj);
      if (!subscriptionId) return { ignored: 'no_subscription' };
      return syncStripeSubscription(env, db, subscriptionId);
    }
    default:
      return { ignored: 'unhandled_type' };
  }
}

export async function onRequestPost({ request, env }) {
  if (!env.STRIPE_WEBHOOK_SECRET || !env.STRIPE_SECRET_KEY) {
    return respond({ error: 'billing_not_configured' }, 503);
  }

  const rawBody = await request.text();
  const valid = await verifyStripeSignature(rawBody, request.headers.get('Stripe-Signature'), env.STRIPE_WEBHOOK_SECRET);
  if (!valid) return respond({ error: 'invalid_signature' }, 400);

  let event;
  try { event = JSON.parse(rawBody); } catch { return respond({ error: 'invalid_body' }, 400); }

  // A test-mode event must never touch a live setup, and vice versa.
  if (Boolean(event.livemode) !== (stripeMode(env) === 'live')) {
    console.error('[billing] livemode mismatch', { eventId: event.id, livemode: event.livemode });
    return respond({ error: 'livemode_mismatch' }, 400);
  }

  const db = drizzle(env.MOSHLY_DB);
  const seen = await db.select({ id: schema.billingEvents.id }).from(schema.billingEvents)
    .where(eq(schema.billingEvents.id, event.id)).get();
  if (seen) return respond({ received: true, duplicate: true });

  try {
    const result = await handleStripeEvent(env, db, event);
    await db.insert(schema.billingEvents)
      .values({ id: event.id, provider: 'stripe', type: event.type, createdAt: new Date() })
      .onConflictDoNothing();
    console.info('[billing] event', { id: event.id, type: event.type, result });
    return respond({ received: true });
  } catch (err) {
    console.error('[billing] webhook failed', { id: event.id, type: event.type, error: err.message });
    return respond({ error: 'processing_failed' }, 500);
  }
}
