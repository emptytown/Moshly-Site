# moshly-days-push

Cron Worker (every minute) that sends Web Push for Moshly Days alerts that are due,
so notifications arrive with the app closed.

- Reads `days_sync` (the Days data the Hub already keeps) for users who have a row in
  `push_subscriptions` — registered by `functions/api/days/push.js`.
- Remembers what it sent in `push_sent`, so an alert is pushed once.
- Alert key = notification tag, matching the Days app, so a push and the app's own
  local notification for the same alert replace each other.

## Deploy
```bash
cd workers/days-push && npm install
npx wrangler secret put VAPID_PRIVATE_JWK   # the private JWK (JSON), see below
npx wrangler deploy
```
The matching public key is `VAPID_PUBLIC_KEY` in the root `wrangler.toml` (served by `GET /api/days/push`).
New key pair: `npx @pushforge/builder vapid` (change the public key and the secret together).

## Tests
`node alerts.test.mjs` (which alerts are due) and `node run.test.mjs` (full run against an in-memory SQLite, Node 22+).
