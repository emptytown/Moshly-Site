// POST /api/ai/chat — AI for clients that hold the user's Moshly access token
// (the iOS app, the dashboard). No app secret: the user pays with their own
// credits. Body: { feature, messages, responseFormat?, maxTokens? }. See _ai.js.
import { verifyJWT } from '../_middleware_auth';
import { getAllowedOrigin, corsOptionsResponse } from '../_cors';
import { applyRateLimit, rateLimitedResponse } from '../_rate-limit';
import { runAI } from '../_ai';
import { quotaDb } from '../_quota';

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

export async function onRequestPost({ request, env }) {
  const user = await verifyJWT(request, env);
  if (!user?.userId) return json(request, { error: 'unauthorized' }, 401);

  const retryAfter = await applyRateLimit(env.AUTH_KV, 'ai-chat', `user:${user.userId}`);
  if (retryAfter) return rateLimitedResponse(retryAfter);

  let body;
  try { body = await request.json(); }
  catch { return json(request, { error: 'invalid_body' }, 400); }

  const { feature, messages, responseFormat, maxTokens } = body ?? {};
  try {
    const { ok, status, ...payload } = await runAI(quotaDb(env), env, {
      userId: user.userId, feature, messages, responseFormat, maxTokens, caller: 'client',
    });
    return ok ? json(request, { success: true, ...payload }) : json(request, payload, status);
  } catch (error) {
    console.error('[ai] client chat error', { userId: user.userId, feature, error: error.message });
    return json(request, { error: 'server_error' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  const res = corsOptionsResponse(request, 'POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Credentials', 'true');
  return res;
}
