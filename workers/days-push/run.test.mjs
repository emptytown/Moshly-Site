import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { webcrypto as crypto } from 'node:crypto';
import { runPush } from './src/index.js';

// Minimal D1 facade over node:sqlite
const sqlite = new DatabaseSync(':memory:');
const db = {
  prepare(sql) {
    let args = [];
    const stmt = {
      bind(...a) { args = a; return stmt; },
      async all() { return { results: sqlite.prepare(sql).all(...args) }; },
      async run() { sqlite.prepare(sql).run(...args); return { meta: { changes: 1 } }; },
      _exec() { sqlite.exec(sql); },
    };
    return stmt;
  },
  async batch(stmts) { stmts.forEach((s) => s._exec()); },
};

const now = Date.now();
sqlite.exec(`CREATE TABLE days_sync (user_id TEXT PRIMARY KEY, data TEXT NOT NULL, version INTEGER, updated_at INTEGER)`);
const tasks = [{ id: 't1', title: 'Pay rent', isCompleted: false, alertDate: new Date(now - 60_000).toISOString() }];
sqlite.prepare('INSERT INTO days_sync VALUES (?,?,?,?)').run('u1', JSON.stringify({ tasks }), 1, now);
sqlite.prepare('INSERT INTO days_sync VALUES (?,?,?,?)').run('u2', JSON.stringify({ tasks }), 1, now); // no subscription

// a real subscription key pair so the payload can be encrypted
const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
const raw = Buffer.from(await crypto.subtle.exportKey('raw', kp.publicKey)).toString('base64url');
const auth = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64url');
const vapid = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']);
const jwk = await crypto.subtle.exportKey('jwk', vapid.privateKey);

const calls = [];
globalThis.fetch = async (url, init) => { calls.push({ url, init }); return new Response(null, { status: url.includes('gone') ? 410 : 201 }); };

await runPush({ MOSHLY_DB: db, VAPID_PRIVATE_JWK: JSON.stringify(jwk) }, now); // creates tables, no subs yet
sqlite.prepare('INSERT INTO push_subscriptions VALUES (?,?,?,?,?)').run('https://push.example/ok', 'u1', raw, auth, now);
sqlite.prepare('INSERT INTO push_subscriptions VALUES (?,?,?,?,?)').run('https://push.example/gone', 'u1', raw, auth, now);

const r1 = await runPush({ MOSHLY_DB: db, VAPID_PRIVATE_JWK: JSON.stringify(jwk) }, now);
assert.equal(calls.length, 2, 'one push per device');
assert.equal(r1.sent, 1);
assert.equal(sqlite.prepare('SELECT COUNT(*) c FROM push_subscriptions').get().c, 1, '410 subscription removed');
assert.ok(calls[0].init.headers.get('authorization')?.startsWith('vapid'), 'VAPID auth header');

const r2 = await runPush({ MOSHLY_DB: db, VAPID_PRIVATE_JWK: JSON.stringify(jwk) }, now + 60_000);
assert.equal(calls.length, 2, 'not repeated the next minute');
console.log('run ok', r1, r2);
