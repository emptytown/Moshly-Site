// GET /api/quota — the signed-in user's quotas for this month.
// Auth: the user's Moshly access token (moshly_at cookie or
// `Authorization: Bearer <access token>`), like /api/me. This is what clients
// read directly (dashboard, a future iOS app); app servers use
// /api/internal/quota/balance with their app secret instead.
import { verifyJWT } from './_middleware_auth';
import { getAllowedOrigin, corsOptionsResponse } from './_cors';
import { loadSubscriptionForUser, allQuotaSnapshots, quotaDb } from './_quota';
import { nextUsagePeriodStart } from './_subscription';
import { aiFeatureCosts } from './_ai';

function json(request, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': getAllowedOrigin(request),
      'Access-Control-Allow-Credentials': 'true',
      Vary: 'Origin',
    },
  });
}

export async function onRequestGet({ request, env }) {
  const payload = await verifyJWT(request, env);
  if (!payload?.userId) return json(request, { error: 'unauthorized' }, 401);

  try {
    const sub = await loadSubscriptionForUser(quotaDb(env), payload.userId);
    if (!sub) return json(request, { error: 'no_subscription' }, 404);
    return json(request, {
      plan: sub.plan,
      resetsAt: nextUsagePeriodStart().toISOString(),
      quotas: allQuotaSnapshots(sub),
      aiFeatures: aiFeatureCosts(),
    });
  } catch (error) {
    console.error('[quota] user balance error', { userId: payload.userId, error: error.message });
    return json(request, { error: 'server_error' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return corsOptionsResponse(request, 'GET, OPTIONS');
}
