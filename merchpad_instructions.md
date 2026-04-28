### Connecting MerchPad to Moshly Hub

To connect MerchPad to the Moshly Hub for Single Sign-On (SSO) and unified user sessions, follow these instructions.

#### 1. Redirection Flow
MerchPad should be accessed through the Moshly Hub dashboard. The Hub will redirect users to MerchPad with a short-lived SSO token.

**Endpoint:** `https://merchpad.moshly.io/auth/callback?token=SSO_TOKEN`

#### 2. Validating the Token
When MerchPad receives a token, it must validate it against the Moshly Hub API.

**Validation Request:**
```http
POST https://api.moshly.io/auth/sso/validate
Content-Type: application/json

{
  "token": "SSO_TOKEN"
}
```

**Success Response:**
```json
{
  "ok": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "Artist Name"
  }
}
```

#### 3. Asset Reference
Use the official logo icon located in the Moshly Site assets:
- **Icon URL:** `https://moshly.io/assets/merchpad-logo-icon.svg`

#### 4. Hub Integration (for developers)
If you are developing the MerchPad frontend, you can use the `auth-client.js` from Moshly Core to handle robust session checks:
```html
<script src="https://moshly.io/auth-client.js"></script>
<script>
  // Check if user has an active Hub session
  const user = await window.MoshlyAuth.getSessionRobust();
</script>
```
