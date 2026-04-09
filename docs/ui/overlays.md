# UI Overlays: Drawers & Modals

## Spatial Rule (Mental Mapping)
To create a "prestigious" and predictable UX, we enforce a strict directional logic for all overlays:
- **Left (Navigation)**: Mobile navigation drawer (`dbMobDrawer`). It feels like "opening the menu" or looking back.
- **Right (Actions/Forms)**: Profile edit, projects, app connectors, context menus, audit log. It feels like "moving forward" into a task.

## Centralized Manager: `modal-manager.js`
All major dashboard overlays must be registered and opened through the `ModalManager` to ensure consistency.

### Features:
- **Exclusivity**: Opening a new major modal can automatically close others to prevent UI clutter (`closeOthers: true`).
- **Unified Backdrop**: Uses a shared backdrop logic with a `4px` blur.
- **Escape Key Support**: Global listener that closes the topmost active modal.
- **Body Scroll Lock**: Automatically locks the `<body>` scroll when any modal is open and restores it only when the last one is closed.
- **Mobile-Friendly**: Handles drawer-specific transitions and backdrop syncing for mobile views.

## CSS Conventions
- **Transition Duration**: `0.35s` for all drawer movements.
- **Timing Function**: `cubic-bezier(.4, 0, .2, 1)` (Material Design standard for snappier feel).
- **Left Drawer**: `translateX(-100% → 0)`.
- **Right Drawers**: `translateX(100% → 0)`.

## Profile Edit Pattern
- Unified UI: Instead of two different modals, the Profile Drawer has two states: **View** and **Edit**.
- Smooth Transition: Swapping between states is done via a subtle fade (`opacity .25s`) within the same drawer to maintain context.
- API Sync: The "Save" action updates the profile via `PATCH /api/me` and reverts the UI state without closing the drawer.
