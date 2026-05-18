# Moshly Quota System — AI, PDF, CSV & Beyond

This document is the authoritative reference for how quota/credit tracking works across the Moshly ecosystem. Read it before touching any quota-related code.

## Architecture: Hub-and-Spoke

moshly-site is the **single source of truth** for all user quotas. Spoke apps (Quote, Rank, Run, Merchpad) never track quotas locally — they call the Hub.

```
moshly-site (Hub)
  └── subscriptions table → pdfExportsUsed / aiCreditsUsed / ...
       ↑ POST /api/internal/quota/consume
       ↑ GET  /api/internal/quota/balance
       │
       ├── Quote  (MOSHLY_APP_SECRET=<quote-uuid>)
       ├── Rank   (MOSHLY_APP_SECRET=<rank-uuid>)
       ├── Run    (MOSHLY_APP_SECRET=<run-uuid>)
       └── Merchpad (MOSHLY_APP_SECRET=<merchpad-uuid>)
```

## Hub Endpoints

### POST /api/internal/quota/consume

Deducts quota. Blocked by `enforceLimit` resources if over limit.

**Auth:** `Authorization: Bearer <MOSHLY_APP_SECRET>`

**Request body:**
```json
{ "userId": "<moshly user id>", "resource": "ai_credits", "amount": 5 }
```

**Success response:**
```json
{ "success": true, "used": 45, "limit": 100, "remaining": 55 }
```

**Error responses:**
| `error` field        | HTTP | Meaning |
|----------------------|------|---------|
| `unauthorized`       | 401  | Invalid or missing app secret |
| `unknown_resource`   | 400  | Resource name not in registry |
| `invalid_amount`     | 400  | Amount out of allowed range |
| `no_subscription`    | 404  | User has no subscription record |
| `insufficient_credits` | 402 | Over limit on an enforced resource |
| `server_error`       | 500  | DB error |

### GET /api/internal/quota/balance?userId=&resource=

Returns current balance without modifying anything.

**Auth:** `Authorization: Bearer <MOSHLY_APP_SECRET>`

**Response:**
```json
{ "used": 45, "limit": 100, "remaining": 55, "resource": "ai_credits", "app": "rank" }
```

## Resource Registry

Defined in `functions/api/internal/quota/consume.js`. Add new resources here.

| Resource      | DB columns                          | enforceLimit | maxPerCall | Notes |
|---------------|-------------------------------------|:---:|:---:|---|
| `ai_credits`  | `aiCreditsUsed` / `aiCreditsLimit`  | ✅  | 50  | Blocks if over limit |
| `pdf_exports` | `pdfExportsUsed` / `pdfExportsLimit`| ❌  | 1   | Tracks only, never blocks |

**To add a new resource** (e.g. `csv_exports`):
1. Add columns to `subscriptions` in `functions/db/schema.ts` + run migration
2. Add entry to `RESOURCES` in `quota/consume.js` and `RESOURCES` in `quota/balance.js`
3. No other Hub changes needed

## Authentication: Per-App Secrets in KV

Each spoke has its own secret. Stored in Cloudflare KV under:
```
appsecret:<secret-uuid>  →  "quote" | "rank" | "run" | "merchpad"
```

The Hub looks up `appsecret:<bearer-token>` on every request to identify the caller.

**To register a new spoke or rotate a secret:**
```bash
# Generate a new secret
openssl rand -hex 32

# Store it in KV (Cloudflare dashboard → KV → AUTH_KV, or via wrangler)
wrangler kv key put "appsecret:<new-secret>" "quote" --binding AUTH_KV

# Set it as a Fly secret on the spoke
fly secrets set MOSHLY_APP_SECRET=<new-secret> -a <app-name>
```

**Rotation is per-app** — rotating Quote's secret does not affect Rank.

## Current App Secrets (KV keys to set)

Set these in `AUTH_KV` on Cloudflare after generating fresh secrets:

| KV key | Value (appId) |
|--------|---------------|
| `appsecret:9f81061c-73b6-4cea-b15c-fa356a5bec5f` | `quote`    |
| `appsecret:625355ed-a4b0-44f5-bd3a-d08651c488d3` | `rank`     |
| `appsecret:20776757-04cf-401e-9b96-9b491ca8ce01` | `run`      |
| `appsecret:951797f6-fdb3-49f4-8997-9f55c5aab14a` | `merchpad` |

And set on each Fly app:
```bash
fly secrets set MOSHLY_HUB_URL=https://moshly.io MOSHLY_APP_SECRET=9f81061c-73b6-4cea-b15c-fa356a5bec5f -a moshly-quote
fly secrets set MOSHLY_HUB_URL=https://moshly.io MOSHLY_APP_SECRET=625355ed-a4b0-44f5-bd3a-d08651c488d3 -a moshly-rank
fly secrets set MOSHLY_HUB_URL=https://moshly.io MOSHLY_APP_SECRET=20776757-04cf-401e-9b96-9b491ca8ce01 -a moshly-run
fly secrets set MOSHLY_HUB_URL=https://moshly.io MOSHLY_APP_SECRET=951797f6-fdb3-49f4-8997-9f55c5aab14a -a moshly-merchpad
```

## Spoke Usage Pattern

Every spoke has a `hub.ts` (or `hub.js`) with these exports:

```typescript
// Check balance before showing UI (non-blocking, returns null if Hub unreachable)
const balance = await getQuotaBalance(userId, "ai_credits");

// Debit that blocks on enforcement (use for AI features — throws TRPCError on 402)
await consumeQuota(userId, "ai_credits", 5);

// Fire-and-forget debit (use for PDF/CSV exports — never blocks the response)
consumeQuotaBackground(userId, "pdf_exports");
```

**Rule:** use `consumeQuota` (blocking) for enforced resources like `ai_credits`.
Use `consumeQuotaBackground` for tracking-only resources like `pdf_exports`.

## Quota Lifecycle

```
User action → spoke calls consumeQuota/consumeQuotaBackground
           → Hub atomically increments usedColumn
           → Hub returns { used, limit, remaining }
           → Spoke logs result (or ignores for background)

Monthly reset → (manual or scheduled) set usedColumn = 0 for all subscriptions
```

There is currently no automatic monthly reset — this is done manually or via a cron job you add to the Hub.
