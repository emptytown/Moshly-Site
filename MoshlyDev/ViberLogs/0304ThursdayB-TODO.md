# Next Session — Auth Fix Plan
**Created:** 2026-04-03 | **Priority:** CRITICAL — do not skip steps

---

## ⚠️ MANDATORY BEFORE WRITING A SINGLE LINE OF CODE

### Read EVERY file in this list. No exceptions. No assumptions.

The last session failed because auth was fixed in `auth-client.js` and `signup.html`
but the same auth logic existed inline in `login.html`, `index.html`, `pricing.html`,
`app-tour.html`, and `launcher.html` — and none of those were read first.

**DO NOT assume any file is clean. READ IT.**

---

## Phase 0 — Full codebase read (do this first, touch nothing)

### Root JS (shared across all pages)
- [x] `auth-client.js` — the core auth client, already known but re-read for state
- [x] `moshly-ui.js` — may reference tokens or session state
- [x] `dashboard-logic.js` — may reference tokens or session state

### ALL HTML files — read the full `<script>` section of each
- [x] `login.html` — has its own inline login handler, broken token write, open redirect
- [x] `index.html` — has inline `handleAuth` for login + register + forgot
- [x] `pricing.html` — has inline `handleAuth` for login + register + forgot
- [x] `app-tour.html` — has inline `handleAuth` for login + register + forgot
- [x] `signup.html` — has its own `handleSignup`, recently updated
- [x] `reset-password.html` — recently updated, re-verify
- [x] `forgot-password.html` — check its inline handler
- [x] `launcher.html` — reads `moshly_token` from localStorage (broken), identity handover
- [x] `dashboard.html` — check for token reads or auth guards
- [x] `setup-profile.html` — check for token reads or auth guards
- [x] `admin.html` — calls 8+ non-existent API endpoints
- [x] `join.html` — calls `/api/waitlist`, redirects to signup
- [x] `contact.html` — check for any auth usage
- [x] `feeme.html` — check for any auth usage

### All API functions — re-read current state
- [x] `functions/_middleware.js`
- [x] `functions/api/_cors.js`
- [x] `functions/api/_middleware_auth.js`
- [x] `functions/api/_password.js`
- [x] `functions/api/_plans.js`
- [x] `functions/api/_rate-limit.js`
- [x] `functions/api/login.js`
- [x] `functions/api/logout.js`
- [x] `functions/api/register.js`
- [x] `functions/api/refresh.js`
- [x] `functions/api/me.js`
- [x] `functions/api/forgot-password.js`
- [x] `functions/api/reset-password.js`
- [x] `functions/api/waitlist.js`
- [x] `functions/api/contact.js`
- [x] `functions/api/admin/invite-codes.js`
- [x] `functions/api/admin/invite-codes/[code].js`

### DB schema — re-read once for reference
- [x] `functions/db/schema.ts`

---

## Phase 1 — Fix broken auth on login.html (✅ RESOLVED)

**Problem:** `login.html` has its own inline login handler that:
- Writes `localStorage.setItem('moshly_token', data.token)` → broken since F-01
- Uses `params.get('redirect')` directly → open redirect (F-02 regression)
- Does not call `MoshlyAuth.setSession()` → `_accessToken` stays null after login

**Fix:**
- Remove the inline handler
- Replace with `MoshlyAuth.handleAuth(event, 'login')` OR rewrite using `MoshlyAuth.setSession()`
- Validate redirect with `isSafeRedirect()` before navigating
- Also fix the `isAuthenticated()` check on lines ~68–70 that uses the same broken redirect

---

## Phase 2 — Fix stale password policy + missing meter on 3 pages (✅ RESOLVED)

**Problem:** `index.html`, `pricing.html`, `app-tour.html` all have:
- `placeholder="Min. 8 characters"` — server now enforces 12
- `minlength="8"` — should be 12
- No strength meter
- `handleAuth(event, 'register')` which silently drops `inviteCode`
- No client-side password validation before server call

**Fix for each page:**
- Update placeholder + minlength to 12
- Add the same strength meter component already in `signup.html` and `reset-password.html`
- Wire `oninput="updateMeter(...)"` on the password input
- Extract the `updateMeter` + `scorePassword` functions to a shared location or duplicate consistently
- Decide: does `handleAuth` type='register' need `inviteCode` support, or are these pages invite-free entry points?

---

## Phase 3 — Fix launcher.html identity handover (✅ RESOLVED)

**Problem:**
- `launcher.html:450` reads `localStorage.getItem('moshly_token')` → always null since F-01
- The token is appended to app URLs as `?token=...` for cross-app SSO
- This is also a security concern (JWT in URL = logs, history, Referer)

**Fix options (decide before writing):**
- Option A: Use `MoshlyAuth.getToken()` instead of localStorage — restores the flow
- Option B: Remove token-in-URL entirely; apps must independently call `/api/refresh` with the HttpOnly cookie
- Option B is more secure. Option A is quick but has the URL exposure problem.
- **Recommended: Option B** — apps should use the HttpOnly cookie, not a token in the URL

---

## Phase 4 — Fix logout.js reverse index cleanup (✅ RESOLVED)

**Problem:** `logout.js` deletes `rt:{token}` but not `rt:user:{userId}`. The F-12 reverse index key lingers for 7 days after logout.

**Fix:**
- Read the userId from the KV stored value before deleting
- Also delete `rt:user:{userId}`
- Add `onRequestOptions` CORS handler (only auth endpoint missing it)

---

## Phase 5 — Fix response shape inconsistency (✅ RESOLVED)

**Problem:** `login.js` returns `user: { id, email, name, role, plan }`. `refresh.js` returns the same plus `jobTitle` and `organization`. Consumers that read `user.jobTitle` from localStorage get it after refresh but not after initial login.

**Fix:**
- `login.js` should either include profile fields (requires JOIN to profiles table, already done in `refresh.js`) or strip them from `refresh.js` response
- Recommended: add the profile JOIN to `login.js` to match `refresh.js`

---

## Phase 6 — Fix me.js PATCH field naming (✅ RESOLVED)

**Problem:** PATCH request body uses `body.org`, but response returns `organization`. Inconsistent API contract.

**Fix:**
- Accept BOTH `body.org` and `body.organization` (backwards-compat), OR
- Standardise on `organization` in both request and response
- Update any client-side code that sends `org`

---

## Phase 7 — Fix invite code TOCTOU in register.js (✅ RESOLVED)

**Problem:** `usesCount >= maxUses` check and the `usesCount + 1` batch operation are not atomic. Two concurrent registrations with the same single-use code can both succeed.

**Fix:**
- Add a KV lock per invite code during registration (same pattern as refresh.js F-03), OR
- Use a D1 `UPDATE ... WHERE usesCount < maxUses` and check `result.meta.changes === 1` before proceeding

---

## Known gaps — flag but do NOT create stub endpoints

**admin.html calls these non-existent endpoints — document, don't stub:**
- `GET /api/admin/flags`
- `POST/DELETE /api/admin/flags/{key}`
- `GET /api/admin/users`
- `POST /api/admin/users/{id}/disable`
- `POST /api/admin/users/{id}/enable`
- `POST /api/admin/users/{id}/revoke`
- `GET/PUT /api/admin/users/{id}/apps`
- `GET /api/apps/state`

These require product decisions before implementation. Do NOT create empty stubs.

---

## Execution rules for next session

1. **Read ALL Phase 0 files before opening an editor.** No exceptions.
2. **Cross-reference every HTML file against auth-client.js** — if a page does auth inline, it must be updated.
3. **After each phase, grep for the pattern you just fixed** across ALL files before moving on.
4. **Run a grep for `moshly_token` and `localStorage.*token`** across all files after Phase 1.
5. **Run a grep for `params.get.*redirect`** across all files after Phase 1.
6. **Commit after each phase** — small, verifiable commits.
7. **Do a final smoke grep before pushing:**
   ```
   grep -rn "moshly_token\|moshly_session_token\|localStorage.*token\|setItem.*token" *.html *.js
   grep -rn "params.get.*redirect\|location.href.*redirect" *.html *.js
   ```

---

## Commit order

```
fix(auth): fix login.html broken token write and open redirect           ← Phase 1
fix(ux): password meter + minlength on index, pricing, app-tour         ← Phase 2
fix(auth): fix launcher identity handover without token-in-URL           ← Phase 3
fix(auth): logout cleans up rt:user reverse index + CORS options        ← Phase 4
fix(api): align login.js user response shape with refresh.js            ← Phase 5
fix(api): standardise me PATCH field name org → organization            ← Phase 6
fix(auth): atomic invite code redemption to prevent TOCTOU race         ← Phase 7
```
