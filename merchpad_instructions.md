# MerchPad ↔ Moshly Hub Integration Guide

## How the flow works

1. User is logged into Moshly Hub (moshly.io/dashboard)
2. User clicks the MerchPad app slot → Hub generates a short-lived SSO token (60s TTL)
3. Hub redirects user to: `https://merchpad.moshly.io/auth/callback?token=<TOKEN>`
4. MerchPad receives the token, validates it against the Hub API (server-side)
5. On success, MerchPad creates its own session cookie and signs the user in

---

## Hub → MerchPad Redirect

The Hub's `window.launchApp()` function handles the redirect:
```
GET /api/auth/sso/token        ← called by Hub (authenticated)
Response: { token: "<uuid>", expiresIn: 60 }

Redirect → https://merchpad.moshly.io/auth/callback?token=<TOKEN>
```

---

## MerchPad: Validate the Token

MerchPad must POST the token to the Hub's verify endpoint **server-side** (to avoid CORS from the browser).

**Endpoint:**
```
POST https://api.moshly.io/auth/sso/verify
Content-Type: application/json

{ "token": "<TOKEN>" }
```

**Success response (HTTP 200):**
```json
{
  "success": true,
  "user": {
    "id": "user_abc123",
    "email": "artist@example.com",
    "role": "user",
    "plan": "collective"
  }
}
```

**Failure responses:**
- `400` + `{ "error": "missing_token" }` — token param not sent
- `401` + `{ "error": "invalid_token" }` — token expired or already used (one-time use)
- `500` + `{ "error": "server_error" }` — Hub-side failure

**Important:** Tokens are one-time use — the Hub deletes the token on first successful verify. Never retry a successful verify response.

---

## Dev Environment

Local hub runs on `http://localhost:8788`.

Dev verify endpoint: `http://localhost:8788/api/auth/sso/verify`

MerchPad `.env.local`:
```
VITE_MOSHLY_HUB_URL=http://localhost:8788
MOSHLY_SSO_VERIFY_URL=http://localhost:8788/api/auth/sso/verify
```

Production `.env`:
```
VITE_MOSHLY_HUB_URL=https://moshly.io
MOSHLY_SSO_VERIFY_URL=https://api.moshly.io/auth/sso/verify
```

---

## CORS

`https://merchpad.moshly.io` is whitelisted in the Hub's `functions/api/_cors.js`.
The token verify call from MerchPad **must be server-side** (Express route) — not from the browser.

---

## Asset Reference

- MerchPad icon: `https://moshly.io/assets/merchpad-logo-icon.svg`
- Hub logo: `https://moshly.io/assets/Moshly-Main-Logo-nofill.svg`
