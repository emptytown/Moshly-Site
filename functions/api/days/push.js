// Web Push registration for Moshly Days.
//
// GET    /api/days/push  → { publicKey }   the VAPID public key to subscribe with
// POST   /api/days/push  → save this device's PushSubscription ({ endpoint, keys })
// DELETE /api/days/push  → forget it ({ endpoint })
//
// Auth (POST/DELETE): `Authorization: Bearer <syncToken>`, the same days sync
// token as /api/days/sync. The cron Worker in workers/days-push reads these rows
// and pushes alerts that are due, so notifications arrive with the app closed.
import { jwtVerify, importSPKI } from 'jose';
import { applyRateLimit } from '../_rate-limit';
import { ensurePushTables } from './_push-store';

const AUDIENCE = 'moshly-days-sync'; // same as DAYS_SYNC_AUDIENCE in sync.js
const ALLOWED_ORIGINS = ['https://days.moshly.io', 'http://localhost:3000'];
const MAX_BODY_BYTES = 4_000;
const MAX_SUBSCRIPTIONS_PER_USER = 10;

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(request, status, body, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders(request), ...extra },
  });
}

async function userIdFrom(request, env) {
  const header = request.headers.get('Authorization') || '';
  if (!header.startsWith('Bearer ') || !env.JWT_PUBLIC_KEY) return null;
  try {
    const key = await importSPKI(env.JWT_PUBLIC_KEY, 'RS256');
    const { payload } = await jwtVerify(header.slice(7), key, {
      algorithms: ['RS256'],
      issuer: 'https://moshly.io',
      audience: AUDIENCE,
    });
    return typeof payload.sub === 'string' && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
}

async function guard(request, env) {
  if (!env.AUTH_KV || !env.MOSHLY_DB) return { error: json(request, 500, { error: 'server_error', message: 'Storage not available' }) };
  const userId = await userIdFrom(request, env);
  if (!userId) return { error: json(request, 401, { error: 'unauthorized', message: 'Open Days from Moshly to reconnect' }) };
  const retryAfter = await applyRateLimit(env.AUTH_KV, 'days-push', `user:${userId}`);
  if (retryAfter) return { error: json(request, 429, { error: 'too_many_requests' }, { 'Retry-After': String(retryAfter) }) };
  return { userId };
}

async function readBody(request) {
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

const isBase64Url = (s) => typeof s === 'string' && s.length > 0 && s.length < 300 && /^[A-Za-z0-9_\-=+/]+$/.test(s);

function isPushEndpoint(value) {
  if (typeof value !== 'string' || value.length > 1000) return false;
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function onRequestGet({ request, env }) {
  if (!env.VAPID_PUBLIC_KEY) return json(request, 503, { error: 'push_unavailable' });
  return json(request, 200, { publicKey: env.VAPID_PUBLIC_KEY });
}

export async function onRequestPost({ request, env }) {
  const g = await guard(request, env);
  if (g.error) return g.error;

  const body = await readBody(request);
  const endpoint = body?.endpoint;
  const p256dh = body?.keys?.p256dh;
  const auth = body?.keys?.auth;
  if (!isPushEndpoint(endpoint) || !isBase64Url(p256dh) || !isBase64Url(auth)) {
    return json(request, 400, { error: 'invalid_subscription' });
  }

  const db = env.MOSHLY_DB;
  await ensurePushTables(db);

  // A device can only hold one row per endpoint; cap how many a user can pile up
  const existing = await db.prepare('SELECT endpoint FROM push_subscriptions WHERE user_id = ? ORDER BY created_at').bind(g.userId).all();
  const rows = existing.results ?? [];
  const overflow = rows.filter((r) => r.endpoint !== endpoint).length + 1 - MAX_SUBSCRIPTIONS_PER_USER;
  if (overflow > 0) {
    for (const row of rows.filter((r) => r.endpoint !== endpoint).slice(0, overflow)) {
      await db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').bind(row.endpoint).run();
    }
  }

  await db
    .prepare(
      `INSERT INTO push_subscriptions (endpoint, user_id, p256dh, auth, created_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth`
    )
    .bind(endpoint, g.userId, p256dh, auth, Date.now())
    .run();

  return json(request, 200, { ok: true });
}

export async function onRequestDelete({ request, env }) {
  const g = await guard(request, env);
  if (g.error) return g.error;

  const body = await readBody(request);
  if (!isPushEndpoint(body?.endpoint)) return json(request, 400, { error: 'invalid_subscription' });

  const db = env.MOSHLY_DB;
  await ensurePushTables(db);
  // only the owner can remove a subscription
  await db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?').bind(body.endpoint, g.userId).run();
  return json(request, 200, { ok: true });
}
