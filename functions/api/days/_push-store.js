// D1 tables for Moshly Days push notifications (created on first use, like days_sync).
//   push_subscriptions — one row per device that turned notifications on
//   push_sent          — alerts already pushed, so a minute-cron never repeats one
// Shared by functions/api/days/push.js and workers/days-push (same D1 database).

export const CREATE_PUSH_TABLES = [
  `CREATE TABLE IF NOT EXISTS push_subscriptions (
    endpoint TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions (user_id)`,
  `CREATE TABLE IF NOT EXISTS push_sent (
    user_id TEXT NOT NULL,
    alert_key TEXT NOT NULL,
    sent_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, alert_key)
  )`,
];

let ready = false;

export async function ensurePushTables(db) {
  if (ready) return;
  await db.batch(CREATE_PUSH_TABLES.map((sql) => db.prepare(sql)));
  ready = true;
}
