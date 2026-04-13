# Known Issues & Troubleshooting

## High-Frequency Errors
- **500 Internal Server Error (Login)**: Often caused by a database schema mismatch. When the code expects columns or tables (like `projects` or `emailVerified`) that aren't in the remote D1 instance, the query fails inside a try-catch, returning a generic 500. **Fix**: Run `npx wrangler d1 migrations apply MOSHLY_DB --remote`.
- **401 Unauthorized (Silent Refresh)**: Appears in the console during load if the user is not logged in. This is expected behavior as `auth-client.js` attempts to check for an existing session cookie. It is handled gracefully by the code.
- **Redirect Loops**: Often occur when a session check on a protected page (`/dashboard`) points back to `/login`, but `/login` itself performs an incorrect session check.
- **Clean URL Mismatches**: Browsers might load `.html` directly if `_redirects` isn't properly configured or if links use `.html` extensions.

## Core Debugging Rules
1. **Auth First**: Before investigating UI bugs, verify the user session in `auth-client.js`.
2. **Console Check**: Always look for `MoshlyAuth` or `MoshlyUI` logs in the browser console.
3. **Redirect Trace**: If a page is flickering or looping, check the Network tab for multiple 301/302/200 redirects.

## Historical Patterns (from MoshlyDev)
- **CSS Transitions**: Modal opening/closing occasionally hit race conditions if multiple modals are triggered simultaneously.
- **Race Conditions**: Auth context might not be fully initialized before `dashboard-logic.js` starts running. Use the central `MoshlyAuth` events where possible.
