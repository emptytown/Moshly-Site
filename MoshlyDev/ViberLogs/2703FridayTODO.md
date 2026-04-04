# Friday TODO: March 27, 2026

Following the "Modern Reconstruction" plan, we are moving away from legacy fragments and external dependencies in favor of a native Cloudflare Pages architecture integrated with Resend.

---

### 📋 Today's Priority: Auth & Resend Integration

#### 1. Database Evolution (Foundation)
- [x] Update `functions/db/schema.ts` to include `resetToken` and `resetExpires` in the `users` table.
  > ✅ Verified: `schema.ts:11-12` — `resetToken: text('reset_token')`, `resetExpires: integer('reset_expires', { mode: 'timestamp' })` — both present.
- [x] Prepare D1 migration script to apply schema changes to the production database.
  > ✅ Verified: `drizzle/migrations/0001_perpetual_outlaw_kid.sql`, `0002_abandoned_chronomancer.sql`, `0003_spicy_dark_phoenix.sql` — all generated.

#### 2. Implement "Forgot Password" Backend
- [x] Create `functions/api/forgot-password.js`.
  > ✅ Verified: File exists and is fully implemented (114 lines). Earlier db-audit note saying it was "empty" was stale — the audit ran on the same day before the work was completed.
- [x] Generate secure, short-lived reset tokens (using `crypto.randomUUID()`).
  > ✅ Verified: `forgot-password.js:49-51` — plain UUID sent in email, SHA-256 hash stored in DB, 1-hour expiry.
- [x] Integrate **Resend** to dispatch reset emails.
  > ✅ Verified: `forgot-password.js:61-97` — full Resend integration with HTML + text body, branded template. Falls back gracefully with `console.warn` if `RESEND_API_KEY` is missing.
- [ ] Verify `RESEND_API_KEY` and `JWT_SECRET` are set in Cloudflare dashboard.
  > ⚠️ Cannot verify from code — requires Cloudflare dashboard confirmation. `AUTH_KV` IDs are still placeholder in `wrangler.toml`.

#### 3. Implement "Reset Password" Backend
- [x] Create `functions/api/reset-password.js`.
  > ✅ Verified: Fully implemented (99 lines). SHA-256 token hash lookup, expiry guard, bcrypt re-hash, atomic TOCTOU-safe UPDATE (nulls out `resetToken`/`resetExpires` in the same write).
- [x] Handle password updates by verifying the token and hashing the new password.
  > ✅ Verified: `reset-password.js:38-82` — pre-check then atomic consume; `result.meta.changes === 0` guards concurrent race.

#### 4. Frontend Wiring (`auth-client.js`)
- [x] Add the `forgot` case to the `handleAuth` function in `auth-client.js`.
  > ✅ Verified: `auth-client.js:226-279` — full `forgot` branch: validates email, calls `POST /api/forgot-password`, shows success/error feedback, restores button state.
- [x] Ensure the UI (`#panelForgot` in `index.html`) correctly triggers the new API.
  > ✅ Verified: Handler wired to `#panelForgot .auth-submit` selector.

#### 5. Email Welcome Flow
- [x] Update `functions/api/register.js` to trigger a "Welcome to Moshly" email via Resend immediately after successful registration.
  > ✅ Verified: `register.js:80-118` — HTML-escaped username, branded template, dashboard CTA link. Wrapped in try/catch so email failure doesn't fail registration.

---

### 🔄 App Communication Schema (Spoke Architecture)

- **Central Hub**: The Hub (at `moshly.io`) handles Authentication and Profile Management.
- **Isolated Spokes**: Tools (e.g., `feeme.moshly.io`) check in with the Hub for session verification.
- **Auth Sync**: Implementation of `postMessage` or shared `localStorage` patterns for cross-origin or subdomain session sharing.

---

#### 6. Database Performance & Optimization
- [x] Optimize `login.js` and `me.js` with SQL JOINs to reduce D1 latency (N+1 queries).
  > ✅ Verified: `login.js:30-39` — single query with `leftJoin` on `workspaces` + `subscriptions`. `me.js:18-29` — single query joining `profiles`, `workspaces`, `subscriptions`.
- [x] Add missing indexes (`workspaces.owner_id`, `invite_codes.workspace_id`, `users.reset_token`) to the schema.
  > ✅ Verified: `schema.ts:16` — `resetTokenIdx`, `schema.ts:37` — `ownerIdIdx`, `schema.ts:61` — `invite_codes_workspace_id_idx`. All present.

> ⚠️ **New issue found — `refresh.js` still has N+1**: `refresh.js:41-66` makes two sequential D1 queries (user → workspace → subscription) with no JOIN. This file was added after Friday's N+1 fix and was not covered. Should be consolidated into a single JOIN query.

---

### 🚀 Future Actions & Maintenance

- [ ] **Security Audit**: Verify reset token hashing and single-use invalidation.
  > Functionally done in code but formal audit not produced.
- [ ] **E2E Testing**: Basic Playwright/Cypress tests for the "Forgot → Reset → Login" flow.
- [ ] **Documentation**: Update `README.md` with new environment variable requirements.

---

*Verified By VibeCheck ✅*
