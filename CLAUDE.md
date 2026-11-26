# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npx wrangler pages dev         # Local dev (Cloudflare Pages + Functions)
npx wrangler d1 execute ...    # Run D1 SQL queries locally
npx wrangler deploy            # Deploy to Cloudflare Pages
```

## Architecture

Moshly-Site is a **Cloudflare Pages** app — static frontend + serverless API via Pages Functions.

```
Browser → Cloudflare Pages (static site)
        → /api/* → Pages Functions (functions/api/) → D1 (SQLite) + KV
```

- **Database**: Cloudflare D1 (SQLite via Drizzle ORM) — `functions/db/schema.ts`
- **KV**: Cloudflare KV (`AUTH_KV`) — stores SSO tokens, refresh tokens, rate limit counters
- **ORM**: Drizzle (`drizzle-orm/d1`)

## Key Directories

| Path | Purpose |
|------|---------|
| `functions/api/` | Pages Functions — one file per route |
| `functions/api/_middleware_auth.js` | RS256 JWT verification (used by all user-facing endpoints) |
| `functions/api/_cors.js` | CORS origin allowlist |
| `functions/api/internal/` | Server-to-server endpoints (verified by `MOSHLY_INTERNAL_SECRET`) |
| `functions/api/auth/sso/` | SSO token issuance and verification for other Moshly apps |
| `functions/db/schema.ts` | Drizzle schema — users, profiles, workspaces, subscriptions, projects, invite codes |

## Authentication

### JWT architecture — two separate systems, do not mix

**1. moshly-site RS256 tokens** (`moshly_at` cookie) — the identity provider layer
- Signed with `JWT_PRIVATE_KEY` (RSA private key, env var, Cloudflare secret)
- Verified with `JWT_PUBLIC_KEY` (RSA public key, env var) in `_middleware_auth.js`
- Claims: `iss: https://moshly.io`, `aud: moshly-api`, exp: 15 min
- Refresh token (`moshly_rt`): UUID stored in KV, rotated on every use, 7-day TTL
- Used for: all user-facing `/api/*` endpoints

**2. SSO bridge** (for other Moshly apps: Quote, Rank, etc.)
- `api/auth/sso/token` — authenticated user calls this; stores a one-time UUID in KV (60s TTL)
- `api/auth/sso/verify` — consuming app exchanges the UUID for user info; UUID deleted immediately
- The consuming app then manages its own session (e.g. Quote issues its own HS256 token)
- The one-time UUID is NOT a credential for any other moshly-site endpoint

**3. Internal API** (server-to-server from other Moshly apps)
- Every route under `api/internal/` authenticates with `authenticateApp()` (`internal/_app-auth.js`), which accepts `Authorization: Bearer <secret>` where the secret is either a per-app secret in KV (`appsecret:<secret>` → app id, preferred) or `MOSHLY_INTERNAL_SECRET` (with `X-Moshly-App: <app id>`).
- No user JWT involved — the caller passes the **Moshly** `userId` (from SSO verify)
- Current internal endpoints: `ai/chat`, `quota/balance`, `quota/consume`, `quota/refund`, `projects`
- The old `ai-credits/*` addresses answer 410 JSON; any unknown `/api/*` answers 404 JSON (`api/[[path]].js`), never the home page
- Quotas (AI credits, PDF exports, monthly reset, how apps must call them): see `AI-PDF-CSV-QUOTA.md`

**4. AI** — this site is the only one that calls the AI provider (`functions/api/_ai.js`).
- Apps: `POST /api/internal/ai/chat` (app secret) via the shared `MoshlyAI` client from moshly-modules. iOS/web: `POST /api/ai/chat` with the user's access token.
- Credits per feature in `AI_FEATURES` (`<app>.<action>`); unknown features are refused. Spends before the call, refunds if the provider fails.

**Rule:** `_middleware_auth.js` verifyJWT expects an RS256 token issued by this app. Never pass SSO UUIDs, HS256 tokens from other apps, or internal secrets to user-facing endpoints — they will always return 401.

## Environment Variables (Cloudflare Secrets / wrangler.toml)

| Variable | Description |
|----------|-------------|
| `JWT_PRIVATE_KEY` | RSA private key (PEM) — signs access tokens |
| `JWT_PUBLIC_KEY` | RSA public key (PEM) — verifies access tokens |
| `MOSHLY_INTERNAL_SECRET` | Shared secret for server-to-server calls from other Moshly apps (per-app secrets in KV are preferred) |
| `AUTH_KV` | KV namespace binding — SSO tokens, refresh tokens, rate limits, per-app secrets (`appsecret:*`) |
| `MOSHLY_DB` | D1 database binding |
| `AI_API_KEY` | AI provider key (secret). The only AI key in Moshly |
| `AI_API_URL` / `AI_MODEL` | Optional: OpenAI-compatible endpoint (default Gemini) and model (default `gemini-2.5-flash`) |
| `SMTP_*` | Email sending (verification, password reset) |

## Homepage News

The `#news` section of `index.html` ("Latest stops") holds auto-numbered news cards, newest first; only the first 3 are shown. `news.html` (`/news`) is the full archive with the same cards. Add each new item at the top of **both** lists and never hard-code numbers. Items with more to say get an article at `news/<slug>.html`, copied from `docs/templates/news-article.html`. See "Homepage News" in `docs/STANDARDS.md`.

## Public site styling

`index.html` and `apps.html` use only `/tokens/neo-brut.css` (vendored from `emptytown/moshly-design-tokens`, do not edit by hand) and `/site.css`. They do not load `style.css`.

## Language

The public site is written in **British English** (`lang="en-GB"`): colour, organise, cancelled; dates as `31 January 2026`; prices in euros. See "Language" in `docs/STANDARDS.md`.

## Admin

`/admin` (`admin.html`) is for accounts with `role = 'god'` only; the dashboard shows an "Admin" link to them. Its API lives in `functions/api/admin/` and every endpoint calls `requireGod()` from `_guard.js`, which checks the JWT role and then the role in the database. To make someone an admin: `UPDATE users SET role='god' WHERE id='...'` (they must log in again).

Plans can be given for a fixed number of months (`subscriptions.expires_at`). `settleSubscription()` in `functions/api/_subscription.js` moves an expired paid plan back to free; call it wherever a subscription is read. It also resets the usage counters at the start of each calendar month (UTC, column `usage_period_start`).

## Database migrations

Apply a new migration to production **before** deploying code that reads its columns (e.g. `0007_usage_period_start.sql`: every subscription read selects `usage_period_start`, so login fails until it exists):
`npx wrangler d1 migrations apply moshly-db --remote`

## Browshly (app frame)

`/app?app=<slug>` (`app.html`) shows Moshly apps inside the installed PWA without leaving moshly.io, so iOS never opens its in-app browser (X + toolbars). Each app runs in its own iframe on its own subdomain (isolated storage and cookies). The Browshly bar (active app's icon = app menu, app name, AI credits, notifications) is drawn here once for every app.

- An app opens in the frame when its `moshly-apps.js` entry has `shell: true`; `origin` is its site when `url` is a page here, `entry` the path that takes the one-time `?token=` (none: no sign-in). Launcher and dashboard links go through `MoshlyApps.shellUrlFor()`.
- Every framed app must send `Content-Security-Policy: frame-ancestors 'self' https://moshly.io` and use `MoshlyShell` from `emptytown/moshly-modules` (never navigate the frame to moshly.io). `_headers` allows `frame-src https://*.moshly.io`.
- Messages accepted from the live apps only (own origin and window): `moshly:home`, `moshly:switcher`, `moshly:reauth`, `moshly:quota-changed`, `moshly:theme` (the bar takes the app's skin colours, remembered per app in `localStorage` `browshly-theme:<slug>`).
