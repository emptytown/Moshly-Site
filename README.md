# Moshly Site

A Cloudflare Pages PWA with clean-URL routing, centralized modal/drawer UX, and client-side auth guards.

## Tech Stack
- **Hosting**: Cloudflare Pages + Functions (Wrangler)
- **Frontend**: HTML/CSS/JS (no framework), PWA patterns
- **Auth**: `auth-client.js` (uses MoshlyAuth), local/session storage
- **Styling**: `dashboard.css`, `style.css`, `pricing.css`
- **UI Behavior**: `moshly-ui.js`, `dashboard-logic.js`, `modal-manager.js`
- **Routing**: `_redirects` (clean URLs), `functions/_middleware.js`
- **Database**: Cloudflare D1 (SQLite) via Drizzle ORM
- **Email**: Resend API

## File Structure (high level)
```
.
├─ _headers
├─ _redirects
├─ assets/
├─ drizzle/
├─ functions/
│  ├─ _middleware.js
│  └─ api/
│     ├─ projects.js
│     └─ contact.js
├─ launching-soon/
│  └─ index.html
├─ MoshlyDev/
│  └─ ViberLogs/*.md (historical notes)
├─ dashboard.html
├─ dashboard.css
├─ dashboard-logic.js
├─ modal-manager.js
├─ moshly-ui.js
├─ auth-client.js
├─ index.html
├─ login.html
├─ signup.html
├─ setup-profile.html
├─ join.html
├─ contact.html
├─ faq.html
├─ admin.html
├─ package.json
├─ wrangler.toml
└─ README.md
```

## Quickstart (Local)
- Install: `npm i`
- Run: `npm start` (serves on http://localhost:3000)
- Open dashboard: http://localhost:3000/dashboard

## Environments
- Production: Cloudflare Pages project `moshly-site`
- Preview Deploys: auto via Wrangler or manual `wrangler pages deploy .`

## Routing (Clean URLs)
- Clean URLs are enforced. Always use paths without `.html`.
  - Examples: `/login`, `/signup`, `/dashboard`, `/contact`, `/faq`
- `_redirects` maps clean routes to their `.html` files at the edge.
- Client-side scripts must not redirect to `*.html`. Use clean paths.

## Auth Guard
- `MoshlyAuth.requireSession(redirect = '/login')`
- Never pass `*.html` to `requireSession`.
- Some pages (e.g., `dashboard.html`) run guards in `dashboard-logic.js`.

## Modal/Drawer UX
- **Spatial Rule**: Navigation (left) vs Actions/Forms (right)
- **Central Manager**: `modal-manager.js`
  - Enforces exclusivity, backdrop, escape key, body scroll lock
  - Right drawers for Profile Edit, Projects, Connectors, etc.
  - Left drawer for mobile nav

## Deployment
- Config: `wrangler.toml`
- Deploy (preview or main): `npx wrangler pages deploy . --project-name moshly-site`

## Troubleshooting
- **Redirect Loops**: ensure all links and `window.location` uses clean paths.
- **Hard Refresh**: if cached, use `Cmd+Shift+R` / `Ctrl+F5`.

## License
© 2026 Moshly — Contrastdetails Lda. All rights reserved.
