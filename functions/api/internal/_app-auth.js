/**
 * Authentication for every server-to-server route under /api/internal/.
 *
 * An app's backend sends `Authorization: Bearer <secret>`. Two kinds of
 * secret are accepted, on every internal route:
 *
 * 1. Per-app secret (preferred). KV `AUTH_KV`, key `appsecret:<secret>` → appId
 *    ("quote", "rank", ...). Identifies the app and can be rotated for one app
 *    without touching the others.
 * 2. The shared `MOSHLY_INTERNAL_SECRET` (kept for compatibility: apps already
 *    deployed with it keep working). The app names itself with the
 *    `X-Moshly-App` header; without it the caller is logged as "internal".
 *
 * Secrets only ever live on app servers. A client (browser, iOS app) never
 * holds one: it calls its own backend, or the user-facing GET /api/quota with
 * the user's Moshly token.
 *
 * Returns { appId, via: 'app_secret' | 'internal_secret' } or null.
 */
export async function authenticateApp(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return null;

  if (env.AUTH_KV) {
    const appId = await env.AUTH_KV.get(`appsecret:${token}`);
    if (appId) return { appId, via: 'app_secret' };
  }

  if (env.MOSHLY_INTERNAL_SECRET && timingSafeEqual(token, env.MOSHLY_INTERNAL_SECRET)) {
    return { appId: declaredAppId(request) || 'internal', via: 'internal_secret' };
  }

  return null;
}

function declaredAppId(request) {
  const raw = (request.headers.get('X-Moshly-App') || '').trim().toLowerCase();
  return /^[a-z0-9-]{1,32}$/.test(raw) ? raw : null;
}

function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  }
  return diff === 0;
}

export function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extraHeaders },
  });
}

export function unauthorizedResponse() {
  return jsonResponse({ error: 'unauthorized' }, 401);
}
