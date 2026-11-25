# Moshly quotas — AI credits, PDF exports and beyond

The authoritative reference for quota tracking across Moshly. Read it before touching quota code here or in an app.

## Model

moshly-site is the **only** place quotas live (`subscriptions` table). Apps never count locally: their **server** asks the site before doing paid work.

```
moshly-site
  subscriptions: ai_credits_used/limit, pdf_exports_used/limit, usage_period_start
     ↑ POST /api/internal/quota/consume   (app servers, app secret)
     ↑ POST /api/internal/quota/refund    (app servers, app secret)
     ↑ GET  /api/internal/quota/balance   (app servers, app secret)
     ↑ GET  /api/quota                    (clients: dashboard, iOS — user's Moshly token)
```

- Limits per plan: `functions/api/_plans.js` (must match `/pricing`).
- Logic: `functions/api/_quota.js` (registry, consume, refund, snapshots). A feature that runs inside this site (e.g. Days) calls `consumeQuota(db, userId, resource, amount)` from there directly — no HTTP, no secret.
- **Monthly reset:** usage periods are calendar months in UTC. Every read of a subscription goes through `settleSubscription()` (`_subscription.js`), which resets both counters to zero the first time it sees a subscription in a new month. Someone who subscribes on the 28th gets a fresh allowance on the 1st.
- **Every resource is enforced.** Going over the limit is refused with 402 — AI credits and PDF exports alike. The Free plan has `pdf_exports_limit = 0`, so it cannot export PDFs.

## Authentication (all `/api/internal/*` routes)

`Authorization: Bearer <secret>`, where the secret is either:

1. **A per-app secret (preferred).** KV `AUTH_KV`, key `appsecret:<secret>` → app id (`quote`, `rank`, `merchpad`, `run`, …). Identifies the app in logs; rotating one app's secret doesn't touch the others.
2. **`MOSHLY_INTERNAL_SECRET`** (the site's shared secret; kept so nothing already deployed breaks). Send `X-Moshly-App: <app id>` with it so logs show who called.

Both are accepted on `quota/*` **and** `projects`. Apps send `X-Moshly-App` in every case.

Secrets only ever live on app **servers** (Fly secrets, Cloudflare secrets). A browser or iOS app never holds one: it calls its own backend, or reads `GET /api/quota` with the user's Moshly access token.

**Register or rotate an app secret** (run by the owner, not by an agent):
```bash
SECRET=$(openssl rand -hex 32)
npx wrangler kv key put "appsecret:$SECRET" "quote" --binding AUTH_KV --remote --preview false
fly secrets set MOSHLY_APP_SECRET=$SECRET -a moshly-quote
# after the app has redeployed with the new secret:
npx wrangler kv key delete "appsecret:<old secret>" --binding AUTH_KV --remote --preview false
```
Never write a secret in this file or anywhere else in git.

## Endpoints

`userId` is always the **Moshly user id** (`user.id` from `/api/auth/sso/verify`), never an id internal to the app.

### POST /api/internal/quota/consume
```json
{ "userId": "<moshly user id>", "resource": "ai_credits", "amount": 5 }
```
→ `200 { "success": true, "resource", "used", "limit", "remaining", "resetsAt" }`

### POST /api/internal/quota/refund
Same body. Gives back quota when the paid work failed after consuming (AI provider error, PDF build error). Never below zero.

### GET /api/internal/quota/balance?userId=&resource=
- with `resource` → `{ resource, used, limit, remaining, resetsAt, app }`
- without → `{ plan, resetsAt, quotas: { ai_credits: {...}, pdf_exports: {...} }, app }`

### GET /api/quota (user token)
`{ plan, resetsAt, quotas: { ai_credits: {...}, pdf_exports: {...} } }` for the signed-in user.

### Errors (always JSON)
| `error` | HTTP | Meaning |
|---|---|---|
| `unauthorized` | 401 | Missing or unknown secret |
| `invalid_body` / `invalid_user_id` | 400 | Bad request |
| `unknown_resource` | 400 | Resource not in the registry |
| `invalid_amount` | 400 | Not an integer between 1 and `maxPerCall` |
| `no_subscription` | 404 | No workspace/subscription for that user |
| `insufficient_credits` | 402 | Would go over the limit (AI credits **and** PDF exports) |
| `server_error` | 500 | Database error |
| `endpoint_moved` | 410 | Old `/api/internal/ai-credits/*` address |
| `not_found` | 404 | Any other unknown `/api/*` address |

## Resource registry (`functions/api/_quota.js`)

| Resource | Columns | maxPerCall |
|---|---|:---:|
| `ai_credits` | `ai_credits_used` / `ai_credits_limit` | 50 |
| `pdf_exports` | `pdf_exports_used` / `pdf_exports_limit` | 1 |

**Adding a resource** (e.g. `csv_exports`): columns in `schema.ts` + a migration, limits in `_plans.js` and `/pricing`, an entry in `QUOTA_RESOURCES`. Apps only need the new resource name.

## How an app uses it

Each app server has a small hub client (`hub.ts`) with the same four calls:

```ts
const quota = await getQuotaBalance(userId);                 // all resources, or null if the site is unreachable
await consumeQuota(userId, "ai_credits", COST);              // throws a "no credits" error on 402 — call BEFORE the work
await refundQuota(userId, "ai_credits", COST);               // if the work then failed
```

Rules:
1. Consume **before** the paid work, refund if it fails. Never consume after sending the result.
2. 402 → show the user they have run out until `resetsAt` (or can upgrade on Moshly). Disable the action in the UI when `remaining` is too low.
3. Treat anything that is not a JSON answer as an error, never as success.
4. Credit costs per action are constants in the app (`AI_CREDIT_COSTS`).
