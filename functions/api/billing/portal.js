// POST /api/billing/portal  { flow?: 'cancel' | 'update' }
// Opens the Stripe customer portal for the signed-in user's workspace and
// returns { url }. Cancelling there takes effect at the end of the paid period.

import { drizzle } from 'drizzle-orm/d1';
import { verifyJWT } from '../_middleware_auth';
import { corsOptionsResponse } from '../_cors';
import { applyRateLimit, rateLimitedResponse } from '../_rate-limit';
import { ENTITLED_STATUSES } from './_config';
import { stripeRequest } from './_stripe';
import { json, loadOwnerWorkspace, siteOrigin } from './_shared';

export async function onRequestPost({ request, env }) {
  const payload = await verifyJWT(request, env);
  if (!payload) return json(request, { error: 'unauthorized', message: 'Unauthorized' }, 401);

  const retryAfter = await applyRateLimit(env.AUTH_KV, 'billing', `user:${payload.userId}`);
  if (retryAfter) return rateLimitedResponse(retryAfter);

  if (!env.STRIPE_SECRET_KEY) {
    return json(request, { error: 'billing_not_configured', message: 'Payments are not available yet.' }, 503);
  }

  let body = {};
  try { body = await request.json(); } catch { /* empty body is fine */ }

  const db = drizzle(env.MOSHLY_DB);
  try {
    const row = await loadOwnerWorkspace(db, payload.userId);
    const sub = row?.subscription;
    if (!sub?.stripeCustomerId) {
      return json(request, { error: 'no_billing_account', message: 'There is no billing account yet. Choose a plan first.' }, 404);
    }

    const params = {
      customer: sub.stripeCustomerId,
      return_url: `${siteOrigin(request)}/dashboard#subscription`,
    };
    const hasLiveSubscription = sub.stripeSubscriptionId && ENTITLED_STATUSES.has(sub.billingStatus);
    if (hasLiveSubscription && body?.flow === 'cancel' && !sub.cancelAtPeriodEnd) {
      params.flow_data = { type: 'subscription_cancel', subscription_cancel: { subscription: sub.stripeSubscriptionId } };
    } else if (hasLiveSubscription && body?.flow === 'update') {
      params.flow_data = { type: 'subscription_update', subscription_update: { subscription: sub.stripeSubscriptionId } };
    }

    const session = await stripeRequest(env, 'POST', '/billing_portal/sessions', params);
    return json(request, { url: session.url });
  } catch (err) {
    console.error('[billing] portal failed', { userId: payload.userId, error: err.message, code: err.code });
    return json(request, { error: 'portal_failed', message: 'Could not open billing. Please try again.' }, 502);
  }
}

export const onRequestOptions = ({ request }) => corsOptionsResponse(request, 'POST, OPTIONS');
