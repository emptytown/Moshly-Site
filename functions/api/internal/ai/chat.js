// POST /api/internal/ai/chat — AI for app servers (app secret, see _app-auth.js).
// Body: { userId, feature, messages, responseFormat?, maxTokens? }
// Spends the feature's credits, calls the model, refunds if it fails. See _ai.js.
import { authenticateApp, unauthorizedResponse, jsonResponse } from '../_app-auth';
import { runAI } from '../../_ai';
import { quotaDb } from '../../_quota';

export async function onRequestPost({ request, env }) {
  const caller = await authenticateApp(request, env);
  if (!caller) return unauthorizedResponse();

  let body;
  try { body = await request.json(); }
  catch { return jsonResponse({ error: 'invalid_body' }, 400); }

  const { userId, feature, messages, responseFormat, maxTokens } = body ?? {};
  if (!userId || typeof userId !== 'string') return jsonResponse({ error: 'invalid_user_id' }, 400);

  try {
    const { ok, status, ...payload } = await runAI(quotaDb(env), env, {
      userId, feature, messages, responseFormat, maxTokens, caller: caller.appId,
    });
    return ok ? jsonResponse({ success: true, ...payload }) : jsonResponse(payload, status);
  } catch (error) {
    console.error('[ai] internal chat error', { app: caller.appId, userId, feature, error: error.message });
    return jsonResponse({ error: 'server_error' }, 500);
  }
}
