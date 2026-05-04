# Moshly Hub

Cloudflare Pages PWA — the central hub for the Moshly platform. Handles auth, billing,
project management, and SSO launch for all `*.moshly.io` apps.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Hosting | Cloudflare Pages + Functions (Wrangler) |
| Frontend | HTML/CSS/JS (no framework), PWA patterns |
| Auth | `auth-client.js` (`MoshlyAuth`) — in-memory JWT, HttpOnly refresh cookie |
| Database | Cloudflare D1 (SQLite) via Drizzle ORM |
| Email | Resend API |
| KV | Cloudflare KV (`AUTH_KV`) — refresh tokens, rate limits |
| Styling | `dashboard.css`, `style.css`, `pricing.css` |
| UI | `moshly-ui.js`, `dashboard-logic.js`, `modal-manager.js` |

---

## Quickstart (Local)

```bash
npm install
npm run dev          # serves at http://localhost:8788
npm run seed:god     # seeds local D1 with a god-tier test account
```

Login: `god@moshly.com` / `moshly123`
Dashboard: http://localhost:8788/dashboard

---

## Clean URL Policy (CRITICAL)

- **Never** use `.html` in links or `window.location`. Use path-only: `/login`, `/dashboard`.
- `_redirects` maps clean paths to HTML files at the edge.
- `_redirects` also redirects `.html` back to clean paths (canonical enforcement).
- AI agents: never generate `.html` links.

---

## Plan Tiers

| Plan | Price | App Slots | PDF Exports | AI Credits | Projects |
|---|---|---|---|---|---|
| Free | €0 | 0 | 0 | topable | 1 |
| Solo | €4.99/mo | 2 | 12/mo | 500/mo | 1 |
| Collective | €9.99/mo | 4 | 50/mo | 1,250/mo | 3 |
| Business | €24.99/mo | 10 | 100/mo | 2,500/mo | 6 |
| Major | €79.99/mo | 150 | 250/mo | 6,000/mo | 15 |

---

## SSO Architecture

The Hub issues short-lived tokens (60s TTL) for launching `*.moshly.io` apps. Apps verify
tokens server-side against the Hub. Full details: [`docs/APP_CONNECTION.md`](docs/APP_CONNECTION.md)

**Key rule:** The Hub API is at `https://moshly.io/api/...` — there is no `api.moshly.io`.

### Verified SSO Endpoints

| Step | Method | URL |
|---|---|---|
| Generate token | `POST` | `https://moshly.io/api/auth/sso/token` |
| Verify token | `POST` | `https://moshly.io/api/auth/sso/verify` |

---

## Deployment

**Auto-deploy:** Push to `main` → Cloudflare Pages builds and deploys automatically.

**Manual preview:**
```bash
npx wrangler pages deploy . --project-name moshly-site
```

**Hard refresh after deploy:** `Cmd+Shift+R` (clears cached JS/CSS).

---

## Documentation

| File | Contents |
|---|---|
| `docs/APP_CONNECTION.md` | Master checklist for connecting any `*.moshly.io` app |
| `docs/STANDARDS.md` | Architecture, clean URLs, routing, deployment |
| `docs/AUTH.md` | Session management, JWT strategy, protected routes |
| `docs/CODEX.md` | AI agent operational protocol |
| `docs/BUGS.md` | Known issues and workarounds |
| `docs/TODO.md` | Roadmap and pending work |

---

## AI Agent Rules

- Read `docs/STANDARDS.md` before writing any code.
- Read relevant `docs/` files before touching auth or SSO.
- **Never use `api.moshly.io`** — it does not exist.
- **Never use `.html` in links or redirects.**
- `authFetch` prepends `/api` automatically — never pass `/api/...` to it.
- Token verify must be server-side (Express) — never from the browser.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Redirect loops | Verify `_redirects` and `window.location` use clean paths |
| SSO 500 / DNS error | Check `MOSHLY_SSO_VERIFY_URL` — must be `https://moshly.io/api/auth/sso/verify` |
| Stale JS/CSS | Hard-refresh: `Cmd+Shift+R` |
| D1 migration errors | Run `npm run db:migrate` and confirm columns exist |

---

© 2026 Moshly — Contrastdetails Lda. All rights reserved.
