# Routing & Clean URLs

## Clean URL Policy
- Always use path-only links (no `.html`): `/login` not `/login.html`.
- `_redirects` maps clean paths to underlying HTML files at the edge.

## Configuration Files
- `_redirects`: Core mapping rules (e.g., `/login /login.html 200`).
- `_headers`: Custom security and caching headers.
- `functions/_middleware.js`: Cloudflare Pages middleware for route-level logic.

## Client Rules
- Never set `window.location.href` or `window.location.replace` to a `.html` file.
- Use clean paths in auth guards: `MoshlyAuth.requireSession('/login')`.
- Ensure `<a>` tags use clean paths: `<a href="/dashboard">Dashboard</a>`.

## Common Paths
- `/` → `index.html`
- `/login` → `login.html`
- `/signup` → `signup.html`
- `/dashboard` → `dashboard.html`
- `/contact` → `contact.html`
- `/faq` → `faq.html`
- `/pricing` → `pricing.html`
