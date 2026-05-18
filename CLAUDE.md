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
- Endpoints under `api/internal/` accept `Authorization: Bearer <MOSHLY_INTERNAL_SECRET>`
- No user JWT involved — the caller passes `?userId=<id>` as a query param
- Current internal endpoints: `ai-credits/balance`, `ai-credits/consume`, `projects`
- Consuming apps (Quote, Rank) must set `MOSHLY_INTERNAL_SECRET` to match this app's env var

**Rule:** `_middleware_auth.js` verifyJWT expects an RS256 token issued by this app. Never pass SSO UUIDs, HS256 tokens from other apps, or internal secrets to user-facing endpoints — they will always return 401.

## Environment Variables (Cloudflare Secrets / wrangler.toml)

| Variable | Description |
|----------|-------------|
| `JWT_PRIVATE_KEY` | RSA private key (PEM) — signs access tokens |
| `JWT_PUBLIC_KEY` | RSA public key (PEM) — verifies access tokens |
| `MOSHLY_INTERNAL_SECRET` | Shared secret for server-to-server calls from other Moshly apps |
| `AUTH_KV` | KV namespace binding — SSO tokens, refresh tokens, rate limits |
| `MOSHLY_DB` | D1 database binding |
| `SMTP_*` | Email sending (verification, password reset) |
