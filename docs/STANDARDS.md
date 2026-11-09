# Project Standards & Architecture

## Overview
- **Architecture**: Static assets hosted on Cloudflare Pages. Functions (`functions/`) for middleware/API.
- **Client-Side**: Auth and UI state managed through `auth-client.js`, `moshly-ui.js`, `dashboard-logic.js`, and `modal-manager.js`.
- **Request Flow**: `_redirects` handles Clean URLs → `_middleware.js` (Cloudflare) → Client scripts.
- **App Modules**: Apps like FifthSense and Quote are stored in the `/apps/` directory to keep the root clean.

## Clean URL Policy (CRITICAL)
- **Rule**: Never use `.html` in links. Use path-only: `/login`, not `/login.html`.
- **Rule**: `_redirects` must map paths to HTML (e.g., `/login /login.html 200`).
- **Rule**: `_redirects` enforces canonical URLs by redirecting `.html` back to clean paths.
- **Rule**: Never set `window.location` to a `.html` file.

## Key Modules
- **Projects API**: `/api/projects.js` handles CRUD operations for user projects, integrated with D1.
- **Auth**: `auth-client.js` manages session checks and login redirects.
- **UI Core**: `moshly-ui.js` provides generic UI helpers.
- **Modals**: `modal-manager.js` is the centralized stack for all drawers and modals.
- **Styles**: `dashboard.css` and `style.css` handle core layout and transitions.

## Deployment & Routing (Cloudflare Pages)
- **Production**: Automatic on `main` branch push.
- **Manual Preview**: `npx wrangler pages deploy . --project-name moshly-site`
- **Core Files**:
  - `wrangler.toml`: Main project config.
  - `_redirects`: Edge routing and clean URL mappings.
  - `_headers`: Security (CSP, HSTS) and caching.
  - `functions/`: Cloudflare Workers backend.

## Path Mappings
- `/` → `index.html`
- `/login` → `login.html`
- `/signup` → `signup.html`
- `/dashboard` → `dashboard.html`
- `/pricing` → `pricing.html`

## Homepage News (Roadmap section, `index.html` `#roadmap`)
- The cards inside `<div class="roadmap-stations">` are **news items, newest first**.
- **To add news**: copy one `<div class="roadmap-station">…</div>` block and paste it as the **first** child of `.roadmap-stations`. Do not touch the others.
- **Do NOT write numbers** in `.roadmap-station-num` — leave it empty. A CSS counter in `style.css` numbers cards by position (01 = newest).
- **Only the first 3 cards are shown** (`.roadmap-station:nth-child(n+4) { display: none; }`). The new item becomes 01, the old 01 becomes 02, and so on; the old 03 is hidden automatically.
- Keep each text to the classic length (~2–3 sentences, ~200–260 chars), in English, with: badge (`New`/`Live`/`Update`), title, short tagline, description, CTA link to the app.
- Hidden older cards may be deleted from the HTML to keep it clean.
- Numbering lives in `style.css`. Whenever you change `style.css` (or any file in `SHELL_ASSETS` of `sw.js`), **bump `CACHE_VERSION` in `sw.js`**, otherwise returning visitors keep the old cached CSS and lose the numbers.
