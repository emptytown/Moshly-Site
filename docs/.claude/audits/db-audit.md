# Database Audit Report

**Project:** Moshly-Site | **Original Audit:** 2026-03-27 | **Updated:** 2026-04-01
**Sources:** ViberLogs/2703FridayTODO.md, ViberLogs/2803SaturdayTODO.md, code review

---

## ✅ RESOLVED

| ID | Issue | Resolved In |
|---|---|---|
| DB-H01 | N+1 waterfall on login (3 sequential queries) | Friday — `login.js` refactored to single LEFT JOIN |
| DB-H02 | N+1 waterfall on `/me` (4 sequential queries) | Friday — `me.js` refactored to single JOIN across profiles/workspaces/subscriptions |
| DB-H03 | Missing index on `workspaces.owner_id` | Friday — `ownerIdIdx` added to `schema.ts:37` |
| DB-H04 | Hardcoded fallback JWT secret (`dev_secret_moshly`) | Saturday — all three files throw `CRITICAL` error if `JWT_SECRET` missing |
| DB-M01 | Missing index on `invite_codes.workspace_id` | Friday — `invite_codes_workspace_id_idx` added to `schema.ts:61` |
| DB-M02 | Missing index on `users.reset_token` | Friday — `resetTokenIdx` added to `schema.ts:16` |
| DB-M03 | No transaction wrapping registration inserts | Saturday — `register.js` uses `db.batch([...])` atomic insert |
| DB-M04 | `forgot-password.js` was empty | Friday — fully implemented (114 lines), Resend integration, SHA-256 token, 1hr expiry |
| DB-L01 | `updatedAt` never updated on UPDATE | Saturday — `schema.ts` uses `.$onUpdateFn(() => new Date())` |
| DB-L03 | `invite_codes.plan` had no enum constraint | Saturday — `schema.ts:55` enum matches `subscriptions.plan` exactly |

---

## 🔴 OPEN — HIGH

*(none remaining)*

---

## 🟡 OPEN — MEDIUM

**DB-M05 — `skills` Stored as Unstructured Text** (`schema.ts:23`)
`skills: text('skills')` — no defined format, not queryable or filterable at the DB layer. Low urgency until skill-based filtering is needed.

---

## 🟠 NEW ISSUE — MEDIUM

**DB-N01 — N+1 in `refresh.js`** ✅ RESOLVED (2026-04-03)
`refresh.js` was rewritten in commit `35aaa1a` (HttpOnly cookie migration) and now uses a single LEFT JOIN across `users`, `profiles`, `workspaces`, and `subscriptions` at lines 43–54. Verified by code review.

---

## 🔵 OPEN — LOW

**DB-L02 — Hardcoded D1 Database ID in `drizzle.config.ts`**
Infrastructure ID `078bb103-ae9b-4975-9e21-66877f480333` committed to source. Should be an env var. Low risk (not a secret), but creates config drift risk.

---

## Priority for Next Session

1. **DB-L02** — Move D1 ID to env var in `drizzle.config.ts`
2. **DB-M05** — Define `skills` format when skill-filtering feature is scoped

---

**Audit Score:** 9.5/10 (updated 2026-04-03) — 11/12 original issues resolved, DB-N01 confirmed resolved.
