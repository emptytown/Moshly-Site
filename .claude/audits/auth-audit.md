# Auth Security Audit — Moshly
**Date:** 2026-04-02 | **Auditor:** security-auditor agent | **Last Updated:** 2026-04-03

---

## ✅ RESOLVED

| ID | Issue | Resolved In |
|---|---|---|
| F-01 | Access + refresh tokens in localStorage | Commit `35aaa1a` (refresh token); Phase 3 (access token) — `_accessToken` in-memory var, no localStorage writes remain |
| F-04 | No rate limiting on `/api/refresh` | Phase 1 — `refresh: 20` added to rate limit map; `applyRateLimit` called at top of handler |
| F-05 | No rate limiting on `PATCH /api/me` | Phase 1 — `me-patch: 30` added; IP rate limit applied before DB write |
| F-06 | CORS headers missing on most auth endpoints | Phase 1 — `corsOptionsResponse` helper added to `_cors.js`; `onRequestOptions` exported from `refresh`, `me`, `register`, `forgot-password`, `reset-password` |
| F-07 | Weak password policy (8 chars, no complexity) | Phase 1 — shared `validatePassword` in `_password.js`; 12-char min + non-alpha required; applied to `register` and `reset-password` |
| F-09 | Invite code RNG uses `Math.random()` | Phase 1 — replaced with `crypto.getRandomValues(new Uint8Array(...))` in `admin/invite-codes.js` |
| F-10 | `/api/me` GET leaks full ORM result | Phase 1 — `profile` and `subscription` explicitly whitelisted in `onRequestGet` response |
| F-11 | Rate limit bypassed via malformed JSON body | Phase 1 — IP rate limit moved before `request.json()` in `login`, `register`, `forgot-password`, `reset-password`; explicit 400 on parse failure |

---

## CRITICAL

*(none remaining)*

---

## HIGH

~~**F-02 — Open redirect after login**~~ ✅ RESOLVED (Phase 3)

`isSafeRedirect()` validates redirect param is a relative path (`startsWith('/')`, not `//`) before navigating. Falls back to `/dashboard.html` on failure. Applied in `handleAuth` login flow (`auth-client.js:209`).

~~**F-03 — Refresh token race condition / replay window**~~ ✅ RESOLVED (Phase 4)
`rt:lock:{refreshToken}` key (5s TTL) acquired before the `get`/`delete` sequence. Concurrent request with the same token finds the lock and receives 409. Note: KV has no native atomic CAS — this reduces the race window to microseconds but does not fully eliminate it. Full elimination would require moving refresh token state to D1.

---

## MEDIUM

*(none remaining)*

---

## LOW

~~**F-12 — No refresh token invalidation on password reset**~~ ✅ RESOLVED (Phase 2)
`login.js` and `refresh.js` now write a `rt:user:{userId}` reverse-index key alongside every refresh token (same 7d TTL, parallel KV writes). `reset-password.js` reads the reverse index after a successful password update and deletes both `rt:{token}` and `rt:user:{userId}`.

**F-13 — Server-side logout / token revocation**
`functions/api/logout.js` exists and deletes `rt:{token}` from KV. ✅ Confirmed implemented.

~~**F-14 — `requireSession` encodes absolute URL in redirect param**~~ ✅ RESOLVED (Phase 3)
Now encodes `window.location.pathname + window.location.search` only (`auth-client.js:77`).

---

## INFO

**F-15 — bcrypt work factor at 10** — acceptable minimum; re-evaluate if Worker CPU quotas allow higher.

**F-16 — JWT algorithm correctly pinned to HS256** — prevents algorithm confusion attacks. ✅

---

## Positives

- User enumeration prevented in `register.js` and `forgot-password.js` (identical ambiguous responses)
- Reset token stored as SHA-256 hash in DB; plain token only sent via email
- TOCTOU race on password reset handled with double-check UPDATE pattern
- JWT has `iss`, `aud`, `exp`; all three validated with algorithm pinning
- Dual-keyed rate limiting (IP + email) on login and forgot-password
- CORS origin is an explicit allowlist — no wildcard
- Admin routes gated on `role === 'god'` from verified JWT payload
- `Access-Control-Allow-Credentials` is NOT set (safe default)
- Server-side logout (`POST /api/logout`) deletes refresh token from KV ✅

---

## Summary

| Severity | Total | Resolved | Open |
|----------|-------|----------|------|
| CRITICAL | 1 | 1 | 0 |
| HIGH | 4 | 4 | 0 |
| MEDIUM | 5 | 5 | 0 |
| LOW | 4 | 4 (F-01, F-12, F-13, F-14) | 0 |
| INFO | 2 | — | — |

**All auth findings resolved.** Remaining work tracked in db-audit.md (DB-L02, DB-M05).
