# Moshly AI and quotas — AI credits, PDF exports and beyond

The authoritative reference for quota tracking across Moshly. Read it before touching quota code here or in an app.

## Model

moshly-site is the **only** place quotas live (`subscriptions` table), and the **only** place that talks to the AI provider. Apps never count locally and never hold an AI key: their **server** asks the site.

## AI (central, on moshly.io)

```
app server ── POST /api/internal/ai/chat  (app secret)  ─┐
iOS / web  ── POST /api/ai/chat           (user token)  ─┴→ functions/api/_ai.js runAI():
                                                              1. feature known?  2. spend its credits
                                                              3. call the model (retries 429/5xx)
                                                              4. failed → refund, 503 ai_unavailable
```

- **Provider config (Cloudflare Pages secrets/vars):** `AI_API_KEY` (required), `AI_API_URL` (OpenAI-compatible chat-completions URL; default Gemini), `AI_MODEL` (default `gemini-2.5-flash`). Changing model or provider is configuration only.
- **Feature registry:** `AI_FEATURES` in `functions/api/_ai.js`: `<app>.<action>` → `{ credits, maxTokens }`. Unknown features are refused (400 `unknown_feature`), so every price is set here. The balance endpoints return the costs as `aiFeatures`.
- **Body:** `{ userId (internal only), feature, messages: [{ role: system|user|assistant, content }], responseFormat?, maxTokens? }`. Limits: 60 messages, 200 000 characters.
- **Answer:** `{ success, content, usage, model, charged: { resource, amount }, quota }`. If the app's own processing of the answer fails, it refunds with `POST /api/internal/quota/refund` and `charged`.
- **User-token route** (`/api/ai/chat`) is rate limited (120 calls / 15 min per user).
- **Apps use the shared client** `MoshlyAI` from emptytown/moshly-modules (`modules/MoshlyAI/moshly.ts`), vendored as `server/_vendor/moshly.ts`.

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
| `unknown_feature` / `invalid_messages` / `input_too_long` | 400 | AI request the site won't run |
| `ai_unavailable` | 503 | AI provider failed or `AI_API_KEY` missing; credits refunded |
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

Vendor `modules/MoshlyAI/moshly.ts` from moshly-modules (see its README), then:

```ts
const moshly = createMoshlyClient({ appId: "quote", appSecret: process.env.MOSHLY_APP_SECRET!, hubUrl: process.env.MOSHLY_HUB_URL });
const answer = await moshly.ai.chat({ userId, feature: "quote.chat", messages });  // AI: credits handled on moshly.io
await moshly.quota.consume(userId, "pdf_exports");                                 // non-AI: before the work
await moshly.quota.refund(userId, { resource: "pdf_exports", amount: 1 });         // if the work failed
const overview = await moshly.quota.overview(userId);                              // UI: remaining, resetsAt, aiFeatures
```

Rules:
1. Spend **before** the paid work, refund if it fails. Never spend after sending the result.
2. Errors are `MoshlyError`; show `err.message` to the user. 402 means out of credits until `resetsAt` (or upgrade); disable the action in the UI when `remaining` is too low.
3. Anything that is not a JSON answer is an error, never a success (the client enforces this).
4. A new AI feature = one entry in `AI_FEATURES` here + `moshly.ai.chat({ feature })` in the app.
