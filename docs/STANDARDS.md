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
