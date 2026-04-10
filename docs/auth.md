# Authentication & Security

## Session Management
- **Central Authority**: `auth-client.js` handles all session checks and redirect logic.
- **Helper**: `MoshlyAuth.requireSession(redirectUrl)`.
  - **Redirect Pattern**: Defaults to `/login`.
  - **Safety Rule**: Automatically strips `.html` from the path. Always use clean paths in parameters.
- **Storage**: Sessions are held in `localStorage` and `sessionStorage`.

## Protected Routes
The following pages require a valid session:
- `/dashboard`
- `/launcher`
- `/setup-profile`
- `/admin`

## Auth Flows
1. **Login**: Standard form on `/login`.
2. **Signup**: Standard form on `/signup`.
3. **Join/Invite**: `/join` (maps to `join.html`) validates invite codes before signup.
4. **Context Handover**: `launcher.html` passes auth context to external applications.

## Redirection Logic
- Redirects must only use clean, path-only URLs (e.g., `/login`).
- `dashboard-logic.js` is the primary entry point for session verification on protected pages.
- After a successful login, the system should return the user to the originally requested destination.
