# Changelog

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
