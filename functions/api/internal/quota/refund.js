// POST /api/internal/quota/refund  { userId, resource, amount? }
// Gives quota back when the work it paid for failed (AI provider error,
// PDF build error). Never takes usage below zero.
import { corsOptionsResponse } from '../../_cors';
import { authenticateApp, unauthorizedResponse, jsonResponse } from '../_app-auth';
import { refundQuota, quotaDb } from '../../_quota';

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
    const { ok, status, ...payload } = await refundQuota(quotaDb(env), userId, resource, amount);
    if (!ok) return jsonResponse(payload, status);
    console.info('[quota] refunded', { app: caller.appId, userId, resource, amount, used: payload.used });
    return jsonResponse({ success: true, ...payload });
  } catch (error) {
    console.error('[quota] refund error', { app: caller.appId, userId, resource, amount, error: error.message });
    return jsonResponse({ error: 'server_error' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return corsOptionsResponse(request, 'POST, OPTIONS');
}
