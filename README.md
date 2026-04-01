# Moshly Site

Moshly is a suite of micro-tools for touring artists, managers, and creative professionals. This repository is the main marketing + auth site for the Moshly platform.

## Tech Stack

- **Frontend**: HTML5, Vanilla JavaScript, CSS3
- **Backend**: Cloudflare Pages Functions (`functions/api/`)
- **Database**: Cloudflare D1 (SQLite) via Drizzle ORM
- **Session Store**: Cloudflare KV (`AUTH_KV`) — refresh tokens + rate limiting
- **Payments**: [Paddle](https://paddle.com/) — billing and subscription management (integration pending)
- **Email**: Resend API — transactional email from `noreply@moshly.io`
- **Auth**: JWT HS256 (15 min access tokens), rotating 7-day refresh tokens
- **Fonts**: Google Fonts (Inter)

## Project Structure

```
.
├── index.html                  # Landing page
├── pricing.html                # Plans + contact form
├── contact.html                # About + contact form
├── login.html                  # Dedicated login page
├── signup.html                 # Dedicated signup page
├── join.html                   # Invite code entry
├── forgot-password.html        # Password reset request
├── reset-password.html         # Password reset (token)
├── setup-profile.html          # Post-signup profile setup
├── admin.html                  # God-tier admin (invite codes)
├── faq.html                    # FAQ
├── privacy.html                # Privacy policy
├── terms.html                  # Terms of service
├── style.css                   # Global styles
├── pricing.css                 # Pricing + contact form styles
├── auth-client.js              # Auth helpers (requireSession, requireGod, authFetch)
├── auth-sync.js                # Lightweight session sync (nav state)
├── moshly-ui.js                # UI utilities (theme toggle, mobile nav, reveal)
├── assets/                     # Images, icons, logos
├── functions/
│   ├── api/
│   │   ├── _middleware_auth.js         # JWT verification middleware
│   │   ├── _rate-limit.js             # KV-backed rate limiter
│   │   ├── login.js                   # POST /api/login
│   │   ├── register.js                # POST /api/register
│   │   ├── refresh.js                 # POST /api/refresh
│   │   ├── me.js                      # GET /api/me
│   │   ├── forgot-password.js         # POST /api/forgot-password
│   │   ├── reset-password.js          # POST /api/reset-password
│   │   ├── contact.js                 # POST /api/contact
│   │   ├── waitlist.js                # POST /api/waitlist
│   │   └── admin/
│   │       ├── invite-codes.js        # GET/POST /api/admin/invite-codes
│   │       └── invite-codes/[code].js # DELETE /api/admin/invite-codes/:code
│   └── db/
│       └── schema.ts                  # Drizzle schema
├── drizzle/migrations/                # D1 migration SQL files
├── wrangler.toml                      # Cloudflare config
└── .dev.vars                          # Local secrets (gitignored)
```

## Local Development

Requires [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/).

```bash
npm install
wrangler pages dev . --port 8788
```

Site runs at `http://localhost:8788`.

### Environment Variables

Create `.dev.vars` in the project root:

```
RESEND_API_KEY=your_resend_key
JWT_SECRET=your_local_dev_secret
RESEND_FROM_EMAIL=noreply@moshly.io
CONTACT_NOTIFY_TO=hello@moshly.io
```

For production, set `RESEND_API_KEY` and `JWT_SECRET` as **Secrets** in the Cloudflare Pages dashboard.

## Database

Migrations live in `drizzle/migrations/`. To apply remotely:

```bash
wrangler d1 migrations apply moshly-db --remote
```

## Deployment

Pushing to `main` triggers automatic deployment via Cloudflare Pages CI.

For manual deploy:

```bash
wrangler login
wrangler pages deploy . --project-name moshly-site
```

## Pricing Plans

| Plan | Price | Notes |
|---|---|---|
| Free | €0 | 1 project, future free tools |
| Solo | €4.99/mo | 2 tools, 12 PDF exports, 500 AI credits |
| Collective | €9.99/mo | 4 tools, 50 PDF exports, 1,250 AI credits |
| Business | €24.99/mo | 10 tools, 100 PDF exports, 2,500 AI credits |
| Major | €79.99/mo | All tools, 250 PDF exports, 6,000 AI credits |

Yearly billing available at ~2 months free.

## Auth Flow

All auth is page-based — no modals.

- `/login.html` → `/signup.html` → `/setup-profile.html`
- `/join.html` for invite code redemption
- `/forgot-password.html` + `/reset-password.html` for recovery
- Nav login buttons link to `/login.html` site-wide

## License

© 2026 Moshly — Contrastdetails Lda. All rights reserved.
