# Authentication

## Session Guard
- **Helper**: `MoshlyAuth.requireSession(redirectUrl)` (defined in `auth-client.js`).
- **Functionality**: Checks for a valid session. If missing, it redirects the browser to the provided URL (defaults to `/login`).
- **Clean URL Standard**: Never pass `.html` to the redirect parameter. The function includes a safety check that automatically strips `.html` from the path.

## Protected Pages
The following pages are behind the auth guard:
- `/dashboard`
- `/launcher`
- `/setup-profile`
- `/admin`

## Auth Logic
- **Storage**: Sessions are managed via local and session storage.
- **Handover**: `launcher.html` handles passing auth context to external apps.
- **Login/Signup**: Standard forms on clean `/login` and `/signup` paths.
- **Invitation**: `join.html` (clean path `/join`) handles invite code validation before signup.

## Redirection Flow
1. User visits `/dashboard`.
2. `dashboard-logic.js` calls `requireSession('/login')`.
3. If not logged in, user is sent to `/login`.
4. After successful login, user is returned to their original destination.
