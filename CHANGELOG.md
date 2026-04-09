# Changelog

## 2026-04-09
- **Clean URL Migration**: Standardized the entire application on "Clean URLs" (e.g., `/login` instead of `/login.html`).
- **Resolved "Too Many Redirects"**: Eliminated the redirect loop in production by removing client-side dependencies on `.html` files in all `location.replace` and `requireSession` calls.
- **`ModalManager` Architecture**: Introduced a centralized manager for all dashboard overlays to handle stacking, exclusivity, and mobile transitions.
- **Prestigious Spatial Rule**: Standardized all UI transitions (Left for Nav, Right for Actions/Forms) to create a more professional, native PWA feel.
- **Unified Backdrops**: Standardized all modal backdrops with a 4px blur and consistent 0.35s animations.
- **Internal Transitions**: Implemented smooth fade-based swapping between View and Edit states within the Profile drawer.
- **Documentation Overhaul**: Created comprehensive documentation for the project's architecture, routing, and UI standards.
