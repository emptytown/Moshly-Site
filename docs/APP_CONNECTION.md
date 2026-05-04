# App Connection Guide — Master Checklist

Master reference for connecting any `*.moshly.io` app to the Hub via SSO.
Replaces `merchpad_instructions.md` and supersedes the app-local `MOSHLY_INTEGRATION.md` files.

---

## Verified SSO Endpoints

| Step | Method | URL | Caller |
|---|---|---|---|
| Generate token | `POST` | `https://moshly.io/api/auth/sso/token` | Hub (authFetch — requires JWT) |
| Redirect with token | `GET` redirect | `https://<app>.moshly.io/auth/callback?token=TOKEN` | Browser |
| Verify token | `POST` | `https://moshly.io/api/auth/sso/verify` | App Express (server-side, no JWT) |
| Rehydrate session | `GET` | `/api/auth/me` | App Express (reads HttpOnly cookie) |
| Logout | `POST` | `/api/auth/logout` | App Express (clears cookie) |

**Dev overrides:** Replace `https://moshly.io` with `http://localhost:8788`.

> There is **no** `api.moshly.io` subdomain. All Hub API calls go to `https://moshly.io/api/...`.

---

## SSO Flow (Step-by-Step)

```
1. Hub: user clicks app slot in dashboard
2. Hub: calls POST /api/auth/sso/token (authenticated, short-lived JWT)
   → Response: { token: "<uuid>", expiresIn: 60 }
3. Hub: window.location = "https://<app>.moshly.io/auth/callback?token=<TOKEN>"
4. App browser: AuthCallback component reads token from URL
5. App browser: POST /api/auth/moshly-verify (to own Express server)
   → Body: { token: "<TOKEN>" }
6. App Express: POST https://moshly.io/api/auth/sso/verify
   → Body: { token: "<TOKEN>" }
   → Response: { success: true, user: { id, email, role, plan } }
7. App Express: sets HttpOnly cookie (mp_session) with user data
8. App Express: returns { ok: true, user } to browser
9. App browser: navigates to /
```

Token is 60-second TTL and **single-use** — destroyed on first successful verify. Never retry.

---

## Hub-Side Checklist

### 1. Add to APP_CATALOG (`dashboard-logic.js` + `launcher.html`)
```js
{
  slug: 'myapp',
  name: 'MyApp',
  description: 'Short description',
  status: 'live',           // or 'soon'
  iconAsset: 'assets/myapp-logo-icon.svg',
  url: 'https://myapp.moshly.io',
  type: 'Plan app',         // or 'Free'
  categories: ['Business']
}
```

### 2. Add origin to CORS allowlist (`functions/api/_cors.js`)
```js
const ALLOWED_ORIGINS = [
  'https://moshly.io',
  'https://myapp.moshly.io',
  // ...existing entries
];
```

### 3. Wire `launchApp` routing (`dashboard.html`)
The Hub's `window.launchApp(slug)` must handle the new slug in its routing logic.
Check for existing `case` statements or URL-based routing — add the new app there.

### 4. Add app icon SVG to `assets/`
File: `assets/myapp-logo-icon.svg`

---

## App-Side Checklist

### 1. Express route: `POST /api/auth/moshly-verify`
```ts
app.post("/api/auth/moshly-verify", async (req, res) => {
  const { token } = req.body ?? {};
  if (!token) { res.status(400).json({ error: "missing_token" }); return; }
  try {
    const hubRes = await fetch(process.env.MOSHLY_SSO_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await hubRes.json();
    if (!hubRes.ok || !data.success) {
      res.status(401).json({ error: "invalid_token" }); return;
    }
    res.cookie("mp_session", JSON.stringify(data.user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ ok: true, user: data.user });
  } catch (err) {
    console.error("SSO verify error:", err);
    res.status(500).json({ error: "server_error" });
  }
});
```

### 2. Express route: `GET /api/auth/me`
```ts
app.get("/api/auth/me", (req, res) => {
  const raw = req.cookies?.mp_session;
  if (!raw) { res.status(401).json({ error: "no_session" }); return; }
  try { res.json({ user: JSON.parse(raw) }); }
  catch { res.status(401).json({ error: "invalid_session" }); }
});
```

### 3. Express route: `POST /api/auth/logout`
```ts
app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie("mp_session");
  res.json({ ok: true });
});
```

### 4. React: `AuthCallback` page (route `/auth/callback`)
```tsx
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function AuthCallback() {
  const [, navigate] = useLocation();
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) { navigate("/"); return; }
    fetch("/api/auth/moshly-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(r => r.ok ? navigate("/") : navigate("/?auth_error=1"))
      .catch(() => navigate("/?auth_error=1"));
  }, []);
  return <p>Signing in…</p>;
}
```

### 5. React: Auth context (`MoshlyAuthContext`)
```tsx
// On mount, call GET /api/auth/me to rehydrate session
// Expose: { user, loading, logout }
```

### 6. Environment variables

**Production (`.env` / Fly secrets):**
```
VITE_MOSHLY_HUB_URL=https://moshly.io
MOSHLY_SSO_VERIFY_URL=https://moshly.io/api/auth/sso/verify
```

**Dev (`.env.local`, not committed):**
```
VITE_MOSHLY_HUB_URL=http://localhost:8788
MOSHLY_SSO_VERIFY_URL=http://localhost:8788/api/auth/sso/verify
```

Set on Fly.io: `fly secrets set MOSHLY_SSO_VERIFY_URL=https://moshly.io/api/auth/sso/verify`

---

## API Contracts

### `POST https://moshly.io/api/auth/sso/token` (Hub — requires auth JWT)
```
Authorization: Bearer <access_token>
```
Response 200:
```json
{ "token": "<uuid>", "expiresIn": 60 }
```

### `POST https://moshly.io/api/auth/sso/verify` (Hub — no auth required)
Request:
```json
{ "token": "<uuid>" }
```
Response 200:
```json
{ "success": true, "user": { "id": "...", "email": "...", "role": "...", "plan": "..." } }
```
Errors: `400` missing token · `401` invalid/expired · `500` server error

---

## Deploy Checklist (Fly.io)

```bash
# 1. Deploy app
fly deploy

# 2. Set SSO secret (REQUIRED before any SSO test)
fly secrets set MOSHLY_SSO_VERIFY_URL=https://moshly.io/api/auth/sso/verify

# 3. Add custom domain cert
fly certs add myapp.moshly.io

# 4. Add DNS CNAME
# myapp.moshly.io → moshly-myapp.fly.dev
```

---

## Testing Checklist

### Local (dev)
- [ ] Hub running at `localhost:8788` (`npm run dev` in Moshly-Site)
- [ ] App running at `localhost:3000` (`pnpm dev` in app repo)
- [ ] `.env.local` has `MOSHLY_SSO_VERIFY_URL=http://localhost:8788/api/auth/sso/verify`
- [ ] Log in at `localhost:8788/login` → dashboard → click app slot
- [ ] Verify landing at `localhost:3000/auth/callback?token=...`
- [ ] Verify redirect to `/` with session cookie `mp_session` set
- [ ] Hard-refresh: `GET /api/auth/me` returns user from cookie

### Production smoke test
```bash
# Verify Hub endpoint is live (expect 401 for invalid token)
curl -X POST https://moshly.io/api/auth/sso/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"test"}'
# Expected: {"error":"invalid_token"} with HTTP 401

# Verify app is reachable
curl -I https://myapp.moshly.io
# Expected: 200 or 301
```

---

## AI Guardrails — SSO Work

```
NEVER use api.moshly.io — it does not exist. Use https://moshly.io/api/...
NEVER call authFetch with /api/* prefix — authFetch prepends /api internally
NEVER call GET /api/auth/sso/token — it only accepts POST
ALWAYS add new app origins to functions/api/_cors.js before testing
ALWAYS set MOSHLY_SSO_VERIFY_URL via fly secrets before deploying
Token verify must be server-side (Express) — never from the browser (CORS blocks it)
```
