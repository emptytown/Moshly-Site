# Project Standards & Architecture

## Overview
- **Architecture**: Static assets hosted on Cloudflare Pages. Functions (`functions/`) for middleware/API.
- **Client-Side**: Auth and UI state managed through `auth-client.js`, `moshly-ui.js`, `dashboard-logic.js`, and `modal-manager.js`.
- **Request Flow**: `_redirects` handles Clean URLs → `_middleware.js` (Cloudflare) → Client scripts.
- **App Modules**: Apps like FifthSense and Quote are stored in the `/apps/` directory to keep the root clean.

## Clean URL Policy (CRITICAL)
- **Rule**: Never use `.html` in links. Use path-only: `/login`, not `/login.html`.
- **Rule**: `_redirects` must map paths to HTML (e.g., `/login /login.html 200`).
- **Rule**: `_redirects` enforces canonical URLs by redirecting `.html` back to clean paths.
- **Rule**: Never set `window.location` to a `.html` file.

## Key Modules
- **Projects API**: `/api/projects.js` handles CRUD operations for user projects, integrated with D1.
- **Auth**: `auth-client.js` manages session checks and login redirects.
- **UI Core**: `moshly-ui.js` provides generic UI helpers.
- **Modals**: `modal-manager.js` is the centralized stack for all drawers and modals.
- **Styles**: `dashboard.css` and `style.css` handle core layout and transitions.

## Deployment & Routing (Cloudflare Pages)
- **Production**: Automatic on `main` branch push.
- **Manual Preview**: `npx wrangler pages deploy . --project-name moshly-site`
- **Core Files**:
  - `wrangler.toml`: Main project config.
  - `_redirects`: Edge routing and clean URL mappings.
  - `_headers`: Security (CSP, HSTS) and caching.
  - `functions/`: Cloudflare Workers backend.

## Path Mappings
- `/` → `index.html`
- `/login` → `login.html`
- `/signup` → `signup.html`
- `/dashboard` → `dashboard.html`
- `/pricing` → `pricing.html`

## Homepage News ("Latest stops", `index.html` `#news`)
- News are "stops on the road": `<li class="news-item card">` items inside `<ol class="news-grid route">`, **newest first**.
- **To add news**: copy one `<li class="news-item card">…</li>` block and paste it as the **first** child of the list. Do not touch the others.
- **Do NOT write numbers** — `.news-num` stays empty. A CSS counter in `site.css` renders "Stop 01, 02, 03" by position, and the newest stop gets the lime "you are here" marker.
- **Only the first 3 items are shown** on the homepage (`.news-grid > .news-item:nth-child(n+4) { display: none; }`). Older items may be deleted from `index.html`, but **never from `news.html`**.

## News archive (`/news`) and articles (`/news/<slug>`)
- `news.html` is the full archive: the **same** `<li class="news-item card">` blocks as the homepage, newest first, nothing hidden (`.news-archive`). Numbering is by position: the newest is always Stop 01 and the rest count up forever (02, 03 … 100 …), so every number shifts by one when a new item is added. Same numbers as the homepage.
- **Every new item goes in two places**: the top of the list in `index.html` **and** the top of the list in `news.html`. Same block, same text.
- **Long story? Write an article.** Only when there is more to say than the card's lead:
  1. Copy `docs/templates/news-article.html` to `news/<slug>.html` (lowercase, hyphens, e.g. `news/merchpad-2.html`). It is served at `/news/<slug>`.
  2. Replace every CAPITALISED placeholder: `<title>`, description, canonical/`og:url`, title, icon, badge, date, lead and text. The article lead is the card's text.
  3. In **both** `index.html` and `news.html`, point that card's link to `/news/<slug>` with the text "Read the story →". The article itself links to the app at the bottom.
  4. Article images go in `assets/news/` with `alt` text.
- Short items need no article: the card keeps linking to the app on `/apps`.
- Keep each text short (~2 sentences), in British English, with: badge (`New` / `Live` / `Update`), app icon from `assets/neo-brut-icons/`, title, short tagline, description, and a link to the app's section on `/apps` (e.g. `/apps#run`).
- Tone: plain and low-key. The audience is bands, small labels and bookers who do it themselves — no hard selling.
- Whenever you change `site.css`, `tokens/neo-brut.css` or any file in `SHELL_ASSETS` of `sw.js`, **bump `CACHE_VERSION` in `sw.js`**.

## Language (public site)
- Moshly is a European product, so the site is clearly **non-US**: **British English** everywhere (`<html lang="en-GB">`).
- Spelling: colour, organise, authorised, personalised, cancelled, centre, licence (noun), programme. Not color, organize, canceled, center.
- Dates as `31 January 2026` (day month year), never `January 31, 2026` or `01/31/2026`. Prices in euros: `€9.99`.
- Words: "sound desk" / "lighting desk", "mobile" (not cell phone), "post code" (not zip code).
