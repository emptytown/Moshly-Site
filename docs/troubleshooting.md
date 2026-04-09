# Troubleshooting

## Redirect Loops ("Too Many Redirects")
### Symptom:
The browser displays a "Too Many Redirects" error when accessing `/dashboard`, `/login`, or other pages.

### Cause:
This occurs due to a conflict between the **server-side** redirect rules (which strip `.html`) and the **client-side** JavaScript (which was requesting `.html` paths).

### Resolution:
1. Ensure all `window.location.replace` and `window.location.href` calls in the JavaScript use **Clean URLs** (e.g., `/login` instead of `/login.html`).
2. Ensure all `<a>` links use clean paths.
3. Verify that `_redirects` is correctly mapping clean routes to their HTML files.
4. If the error persists after updates, **Purge Cache** in the Cloudflare Dashboard to invalidate cached versions of `index.html` or `auth-client.js`.

---

## Local Development Issues
### Issue: Accessing `localhost:3000/dashboard` returns 301.
The local `serve` environment often mimics Cloudflare's clean-URL behavior. Opening the clean URL (`/dashboard`) is the correct way to test.

---

## UI Modal Conflicts
### Issue: Modals overlapping or backdrop not clearing.
Ensure the modal is being opened through the `ModalManager`.
- Use `ModalManager.open('modalID', { closeOthers: true })`.
- Do not manually manipulate `display: block` or `.open` classes on major overlays.
- Ensure the modal ID matches one of the registered IDs in `modal-manager.js`.
