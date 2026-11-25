// Cron Worker: every minute, send a Web Push for each Moshly Days alert that is due.
//
// Reads the D1 database the Hub keeps (days_sync + push_subscriptions), so it
// only touches users who turned notifications on. See functions/api/days/push.js.
import { buildPushHTTPRequest } from '@pushforge/builder';
import { dueAlerts } from './alerts.js';
import { CREATE_PUSH_TABLES } from '../../../functions/api/days/_push-store.js';

const SENT_RETENTION_MS = 3 * 24 * 60 * 60 * 1000;
const MAX_USERS_PER_RUN = 500;

async function sendOne(env, privateJWK, sub, alert) {
  const { endpoint, headers, body } = await buildPushHTTPRequest({
    privateJWK,
    subscription: { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
    message: {
      payload: { title: alert.title, body: alert.body, tag: alert.key, url: '/todo' },
      adminContact: env.PUSH_CONTACT || 'mailto:hello@moshly.io',
      options: { ttl: 3600, urgency: 'high' },
    },
  });
  return fetch(endpoint, { method: 'POST', headers, body });
}

export async function runPush(env, now = Date.now()) {
  const db = env.MOSHLY_DB;
  if (!db || !env.VAPID_PRIVATE_JWK) return { skipped: 'not configured' };
  const privateJWK = JSON.parse(env.VAPID_PRIVATE_JWK);

  await db.batch(CREATE_PUSH_TABLES.map((sql) => db.prepare(sql)));

  const users = await db
    .prepare(
      `SELECT d.user_id AS user_id, d.data AS data FROM days_sync d
       WHERE d.user_id IN (SELECT user_id FROM push_subscriptions) LIMIT ?`
    )
    .bind(MAX_USERS_PER_RUN)
    .all();

  let sent = 0;
  for (const row of users.results ?? []) {
    let data;
    try { data = JSON.parse(row.data); } catch { continue; }

    const sentRows = await db.prepare('SELECT alert_key FROM push_sent WHERE user_id = ?').bind(row.user_id).all();
    const sentKeys = new Set((sentRows.results ?? []).map((r) => r.alert_key));
    const due = dueAlerts(data, sentKeys, now);
    if (due.length === 0) continue;

    const subs = (await db.prepare('SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?').bind(row.user_id).all()).results ?? [];

    for (const alert of due) {
      // Mark first: a crash must not turn into a notification every minute
      await db.prepare('INSERT OR IGNORE INTO push_sent (user_id, alert_key, sent_at) VALUES (?, ?, ?)').bind(row.user_id, alert.key, now).run();
      for (const sub of subs) {
        try {
          const res = await sendOne(env, privateJWK, sub, alert);
          if (res.status === 404 || res.status === 410) {
            // the device unsubscribed or reinstalled: forget it
            await db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').bind(sub.endpoint).run();
          } else if (res.ok) {
            sent++;
          } else {
            console.warn('push refused', res.status);
          }
        } catch (err) {
          console.error('push failed:', err instanceof Error ? err.message : err);
        }
      }
    }
  }

  await db.prepare('DELETE FROM push_sent WHERE sent_at < ?').bind(now - SENT_RETENTION_MS).run();
  return { users: users.results?.length ?? 0, sent };
}

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(runPush(env));
  },
};
