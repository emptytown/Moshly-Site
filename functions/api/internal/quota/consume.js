// POST /api/internal/quota/consume  { userId, resource, amount? }
// Spends quota for a user. 402 `insufficient_credits` when it would go over
// the plan's limit — for AI credits and PDF exports alike.
import { corsOptionsResponse } from '../../_cors';
import { authenticateApp, unauthorizedResponse, jsonResponse } from '../_app-auth';
import { consumeQuota, quotaDb } from '../../_quota';

export async function onRequestPost({ request, env }) {
  const caller = await authenticateApp(request, env);
  if (!caller) return unauthorizedResponse();

  let body;
  try { body = await request.json(); }
  catch { return jsonResponse({ error: 'invalid_body' }, 400); }

  const { userId, resource, amount = 1 } = body ?? {};
  if (!userId || typeof userId !== 'string') {
    return jsonResponse({ error: 'invalid_user_id' }, 400);
  }

  try {
    const result = await consumeQuota(quotaDb(env), userId, resource, amount);
    const { ok, status, ...payload } = result;
    if (!ok) {
      if (status === 402) console.info('[quota] refused', { app: caller.appId, userId, resource, amount });
      return jsonResponse(payload, status);
    }
    console.info('[quota] consumed', { app: caller.appId, userId, resource, amount, used: payload.used, limit: payload.limit });
    return jsonResponse({ success: true, ...payload });
  } catch (error) {
    console.error('[quota] consume error', { app: caller.appId, userId, resource, amount, error: error.message });
    return jsonResponse({ error: 'server_error' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return corsOptionsResponse(request, 'POST, OPTIONS');
}
