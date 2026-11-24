# Changelog

## 2026-11-24 (billing, test mode)
- **Stripe subscriptions**: `POST /api/billing/checkout`, `/portal` and `/webhook` (`functions/api/billing/`). Checkout with automatic tax and VAT number collection; signed, idempotent webhook that re-reads the subscription from Stripe; customer portal for card, invoices, plan changes and cancel at period end. Sandbox price IDs only; live stays off until approved. See `docs/billing.md`.
- **Migration `0007_billing.sql`**: billing fields on `subscriptions` (provider, status, interval, cancel at period end, Stripe IDs, trial used) and a `billing_events` table. Also creates `app_changed_at`, which `me.js` used but never existed.
- **Plans now expire**: `/api/me` and the internal quota endpoints drop expired plans (including invite codes) to Free; Stripe plans are re-checked with Stripe first.
- **Account deletion** cancels the Stripe subscription first.
- **Dashboard**: "Plan and billing" screen (current plan, monthly/yearly plans, Manage billing), live status badge, working Change plan and Cancel plan buttons, in both skins and themes. `CACHE_VERSION` → `v20`.

## 2026-11-23 (cache fix)
- **Stale app catalog after deploys**: `moshly-apps.js` (and the other shell JS/CSS) was served with a 4-hour browser cache, and the service worker pre-cached from that HTTP cache, so a new `CACHE_VERSION` could still store the old file — new apps (e.g. Time) did not show in the App Connector. The SW now pre-caches with `cache: 'reload'` and refreshes in the background with `cache: 'no-cache'`; `_headers` sets `Cache-Control: no-cache` for `/*.js` and `/*.css`. `CACHE_VERSION` bumped to `v16`.

## 2026-11-23
- **New free app: Time**: Added Moshly Time (fullscreen clock, timer, stopwatch and countdowns) to the app catalog in `moshly-apps.js` as a `Free` app at `https://time.moshly.io`, so it shows in the dashboard's free apps and in the launcher without using a plan slot. New icons: `assets/neo-brut-icons/time.png` and `assets/moshly-time-logo-svg.svg`.
- **Public pages**: Time added to `/apps` (jump list and its own entry) and to the homepage app strip, which now has 7 columns (4 on phones). Bumped `CACHE_VERSION` to `v15` in `sw.js`.

## 2026-04-13
- **Auth Race Condition Resolution**: Implemented client-side promise deduplication for concurrent session refresh calls in `auth-client.js` to prevent token rotation collisions.
- **Eliminated Placeholder Ghosting**: Removed the hardcoded "Jane" from `dashboard.html`, replacing it with a neutral loading placeholder to prevent UI flickering during session hydration.
- **Improved Auth Sync**: Updated `moshly-ui.js` to ensure the "Dashboard" button only appears after successful session verification, preventing stale UI states.

## 2026-04-11
- **Settings and Visibility Container**: Restructured the "Visibility" dashboard card into "Settings and Visibility" with three distinct sections: Settings Drawer trigger, Searchable Profile toggle, and Join Moshly Metaverse toggle.
- **Create Project Functionality**: Fully implemented end-to-end project creation, including the `projects` table in D1, a new backend API endpoint (`/api/projects`), and frontend form submission logic.
- **Sign Out Confirmation Flow**: Re-implemented the sign-out process with a two-step confirmation modal, including a "See you soon" message and a brief delay before redirecting.
- **Database Synchronization**: Resolved "Server Error During Login" by synchronizing the production D1 schema with `schema.ts`, adding missing columns to the `users` and `profiles` tables and creating the `projects` table.
- **Auth Client Improvements**: Improved `MoshlyAuth.logout()` to correctly invalidate sessions by calling the `/api/logout` endpoint, clearing the `moshly_rt` cookie.

## 2026-04-09
- **Clean URL Migration**: Standardized the entire application on "Clean URLs" (e.g., `/login` instead of `/login.html`).
- **Resolved "Too Many Redirects"**: Eliminated the redirect loop in production by removing client-side dependencies on `.html` files in all `location.replace` and `requireSession` calls.
- **`ModalManager` Architecture**: Introduced a centralized manager for all dashboard overlays to handle stacking, exclusivity, and mobile transitions.
- **Prestigious Spatial Rule**: Standardized all UI transitions (Left for Nav, Right for Actions/Forms) to create a more professional, native PWA feel.
- **Unified Backdrops**: Standardized all modal backdrops with a 4px blur and consistent 0.35s animations.
- **Internal Transitions**: Implemented smooth fade-based swapping between View and Edit states within the Profile drawer.
- **Documentation Overhaul**: Created comprehensive documentation for the project's architecture, routing, and UI standards.
