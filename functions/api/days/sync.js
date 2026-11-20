// GET /api/days/sync  → the user's Moshly Days data
// PUT /api/days/sync  → merge the device's copy into it, return the merged copy
//
// Auth: `Authorization: Bearer <syncToken>` — an RS256 JWT minted by
// /api/auth/sso/verify for days.moshly.io (aud "moshly-days-sync", 30 days).
// Storage: D1 table days_sync (strongly consistent; created on first use).
// KV (AUTH_KV `days:data:<userId>`) was the first store: it is eventually
// consistent, so a second device could read an older copy and overwrite
// newer data. Any copy left there is folded in on first access.
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

// ─── Storage (D1) ────────────────────────────────────────────────────────────

const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS days_sync (
  user_id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  version INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
)`;
let tableReady = false;

async function ensureTable(db) {
  if (tableReady) return;
  await db.prepare(CREATE_TABLE).run();
  tableReady = true;
}

/** Current copy + its version (0 = no row yet). */
async function load(env, userId) {
  const db = env.MOSHLY_DB;
  await ensureTable(db);
  const row = await db.prepare('SELECT data, version FROM days_sync WHERE user_id = ?').bind(userId).first();
  if (row) {
    try { return { data: JSON.parse(row.data), version: row.version }; } catch { return { data: emptyDaysData(), version: row.version }; }
  }
  const legacy = env.AUTH_KV ? await env.AUTH_KV.get(`days:data:${userId}`, 'json') : null;
  return { data: legacy ?? emptyDaysData(), version: 0 };
}

/** Write only if nobody else wrote since `version` was read (optimistic lock). */
async function save(env, userId, data, version) {
  const db = env.MOSHLY_DB;
  const json = JSON.stringify(data);
  const now = Date.now();
  const res = version === 0
    ? await db.prepare('INSERT INTO days_sync (user_id, data, version, updated_at) VALUES (?, ?, 1, ?) ON CONFLICT(user_id) DO NOTHING').bind(userId, json, now).run()
    : await db.prepare('UPDATE days_sync SET data = ?, version = version + 1, updated_at = ? WHERE user_id = ? AND version = ?').bind(json, now, userId, version).run();
  return (res?.meta?.changes ?? 0) === 1;
}

async function guard(request, env) {
  if (!env.AUTH_KV || !env.MOSHLY_DB) return { error: json(request, 500, { error: 'server_error', message: 'Storage not available' }) };
  const userId = await userIdFrom(request, env);
  if (!userId) return { error: json(request, 401, { error: 'unauthorized', message: 'Open Days from Moshly to reconnect sync' }) };
  const retryAfter = await applyRateLimit(env.AUTH_KV, 'days-sync', `user:${userId}`);
  if (retryAfter) return { error: json(request, 429, { error: 'too_many_requests' }, { 'Retry-After': String(retryAfter) }) };
  return { userId };
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function onRequestGet({ request, env }) {
  const g = await guard(request, env);
  if (g.error) return g.error;
  const { data } = await load(env, g.userId);
  return json(request, 200, data);
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

  // Read → merge → write, retried if another device wrote in between.
  // The stored copy is primary on exact ties so devices converge.
  for (let attempt = 0; attempt < 10; attempt++) {
    const { data, version } = await load(env, g.userId);
    const merged = mergeDaysData(data, incoming);
    if (await save(env, g.userId, merged, version)) return json(request, 200, merged);
    // someone wrote in between: back off a little (with jitter) and merge again
    await new Promise((r) => setTimeout(r, 15 + Math.random() * 60 * (attempt + 1)));
  }
  return json(request, 409, { error: 'conflict', message: 'Busy — try again' });
}
