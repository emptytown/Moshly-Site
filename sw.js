// Bump CACHE_VERSION on every deploy to force cache refresh.
const CACHE_VERSION = 'v4';
const CACHE_NAME = `moshly-shell-${CACHE_VERSION}`;

// Hub shell only — spoke pages (quote, fifthsense) are NOT pre-cached here
// so the SW never intercepts their navigation and returns a stale/wrong response.
const SHELL_ASSETS = [
  '/',
  '/launcher',
  '/dashboard',
  '/style.css',
  '/dashboard.css',
  '/auth-client.js',
  '/moshly-ui.js',
  '/modal-manager.js',
  '/dashboard-logic.js',
  '/assets/Moshly-Main-Logo-1.svg',
  '/assets/favicon.ico',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
];

// These paths always hit the network first; cache is only the offline fallback.
const NETWORK_FIRST_PREFIXES = ['/api/', '/me'];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn('[SW] Shell pre-cache partial failure:', err))
  );
});

// ── Activate: prune stale caches ──────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function isNetworkFirst(url) {
  return NETWORK_FIRST_PREFIXES.some((p) => url.pathname.startsWith(p));
}

function storeInCache(request, response) {
  if (!response || !response.ok) return;
  const clone = response.clone(); // clone synchronously before any async ops consume the body
  caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Cross-origin requests pass through unmodified.
  // External spokes use SSO token redirects and must stay network-dependent.
  if (url.origin !== self.location.origin) return;

  // Network-first for API and auth endpoints.
  if (isNetworkFirst(url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          storeInCache(request, response);
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) =>
            cached ||
            new Response(
              JSON.stringify({ error: 'offline', message: 'No network connection.' }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            )
          )
        )
    );
    return;
  }

  // Network-first for HTML navigation — always fetch fresh HTML, fall back to
  // cache only when offline. This prevents stale pages after deploys.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          storeInCache(request, response);
          return response;
        })
        .catch(() =>
          caches.match(request).then(
            (cached) =>
              cached ||
              caches.match('/launcher').then(
                (fallback) =>
                  fallback ||
                  new Response(
                    '<html><head><meta charset="utf-8"><title>Offline \u2013 Moshly</title></head><body style="background:#070a14;color:#fff;font-family:-apple-system,sans-serif;display:grid;place-items:center;min-height:100vh;text-align:center"><div><h1 style="font-size:2rem;margin-bottom:8px">Offline</h1><p style="opacity:.5;margin-bottom:24px">Reconnect to use Moshly.</p><button onclick="window.location.reload()" style="background:#fff;color:#070a14;border:none;padding:10px 24px;border-radius:8px;font-size:1rem;cursor:pointer;font-weight:600">Try Again</button></div><script>window.addEventListener(\'online\',()=>window.location.reload())<\/script></body></html>',
                    { headers: { 'Content-Type': 'text/html' } }
                  )
              )
          )
        )
    );
    return;
  }

  // Cache-first for shell assets (CSS, JS, images); fetch + update cache in background.
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          storeInCache(request, response);
          return response;
        })
        .catch(() => new Response('', { status: 408 }));

      return cached || networkFetch;
    })
  );
});
