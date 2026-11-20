// GET /api/days/sync  → the user's Moshly Days data
// PUT /api/days/sync  → merge the device's copy into it, return the merged copy
//
// Auth: `Authorization: Bearer <syncToken>` — an RS256 JWT minted by
// /api/auth/sso/verify for days.moshly.io (aud "moshly-days-sync", 30 days).
// Storage: AUTH_KV key `days:data:<userId>`.
import { jwtVerify, importSPKI } from 'jose';
import { applyRateLimit } from '../_rate-limit';
import { emptyDaysData, mergeDaysData } from './_merge';

export const DAYS_SYNC_AUDIENCE = 'moshly-days-sync';
const ALLOWED_ORIGINS = ['https://days.moshly.io', 'http://localhost:3000'];
const MAX_BODY_BYTES = 2_000_000;
const MAX_TASKS = 20_000;

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
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
      audience: DAYS_SYNC_AUDIENCE,
    });
    return typeof payload.sub === 'string' && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
}

async function guard(request, env) {
  if (!env.AUTH_KV) return { error: json(request, 500, { error: 'server_error', message: 'Storage not available' }) };
  const userId = await userIdFrom(request, env);
  if (!userId) return { error: json(request, 401, { error: 'unauthorized', message: 'Open Days from Moshly to reconnect sync' }) };
  const retryAfter = await applyRateLimit(env.AUTH_KV, 'days-sync', `user:${userId}`);
  if (retryAfter) return { error: json(request, 429, { error: 'too_many_requests' }, { 'Retry-After': String(retryAfter) }) };
  return { userId, key: `days:data:${userId}` };
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function onRequestGet({ request, env }) {
  const g = await guard(request, env);
  if (g.error) return g.error;
  const stored = (await env.AUTH_KV.get(g.key, 'json')) ?? emptyDaysData();
  return json(request, 200, stored);
}

export async function onRequestPut({ request, env }) {
  const g = await guard(request, env);
  if (g.error) return g.error;

  const length = Number(request.headers.get('Content-Length') || 0);
  if (length > MAX_BODY_BYTES) return json(request, 413, { error: 'too_large' });

  let incoming;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return json(request, 413, { error: 'too_large' });
    incoming = JSON.parse(text);
  } catch {
    return json(request, 400, { error: 'invalid_json' });
  }
  if (!incoming || !Array.isArray(incoming.tasks) || incoming.tasks.length > MAX_TASKS) {
    return json(request, 400, { error: 'invalid_payload' });
  }

  const stored = (await env.AUTH_KV.get(g.key, 'json')) ?? emptyDaysData();
  // Stored copy is primary on exact ties so two devices converge on the same data
  const merged = mergeDaysData(stored, incoming);
  await env.AUTH_KV.put(g.key, JSON.stringify(merged));
  return json(request, 200, merged);
}
