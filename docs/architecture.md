# Architecture Overview

## Overview
- Static assets hosted by Cloudflare Pages.
- Functions route (`functions/`) for middleware and light APIs.
- Client-side auth and UI state management (drawers/modals).

## Key Modules
- **Auth**: `auth-client.js` (session checks, redirect-to-login).
- **UI Core**: `moshly-ui.js` (generic helpers).
- **Dashboard Logic**: `dashboard-logic.js` (page orchestration).
- **Modals/Drawers**: `modal-manager.js` (centralized open/close, stack).
- **Styles**: `dashboard.css`, `style.css` (transitions, layout).

## Request Flow
1. Incoming request → Cloudflare Pages clean URLs via `_redirects`.
2. Middleware (`functions/_middleware.js`) can enrich/guard routes.
3. Client loads page → `auth-client.js` may redirect to `/login`.
4. Dashboard UI interactions managed via `modal-manager.js`.

## Data & APIs
- **Example function**: `functions/api/contact.js` → handles contact form.
- Other app APIs are remote (not in this repo).
