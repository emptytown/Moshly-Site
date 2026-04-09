# Deployment (Cloudflare Pages)

## Production Hosting
- **Project Name**: `moshly-site`
- **Platform**: Cloudflare Pages.
- **Workflow**: Automated deployment on `git push` to the `main` branch.

## Manual/Preview Deployment
To manually trigger a preview deployment of your current local state:
```bash
npx wrangler pages deploy . --project-name moshly-site
```
For production (specific branch):
```bash
npx wrangler pages deploy . --project-name moshly-site --branch main
```

## Core Deployment Files
- `wrangler.toml`: Main Cloudflare project configuration.
- `_redirects`: Edge rules for Clean URLs and path mappings.
- `_headers`: Custom HTTP headers for security (CSP, HSTS) and cache control.
- `functions/`: Cloudflare Workers functions for API and middleware logic.

## Routing Notes
- `_redirects` ensures paths like `/login` return `login.html` (HTTP 200).
- `_redirects` also enforces a canonical clean-URL rule: any request to `.html` should redirect back to the clean version.

## Verification
- After major routing changes, it is recommended to **Purge Cache** in the Cloudflare Dashboard to ensure consistent user behavior.
