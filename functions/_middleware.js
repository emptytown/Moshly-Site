/**
 * Global Pages Functions middleware.
 *
 * Routing logic:
 *   /              → index.html
 *   /dashboard    → dashboard.html
 *   /admin        → admin.html
 *   /api/*        → delegated to api/ function handlers
 *   everything else → default Pages asset serving
 */

/**
 * Fetches a static asset from the Pages asset binding.
 *
 * @param {object} env - Worker environment (must have ASSETS binding)
 * @param {Request} originalRequest
 * @param {string} assetPath - Absolute path of the asset (e.g. "/dashboard.html")
 * @returns {Promise<Response>}
 */
function serveAsset(env, originalRequest, assetPath) {
  const origin = new URL(originalRequest.url).origin;
  // Fetch the clean URL (no .html) so Cloudflare Pretty URLs serves the file
  // transparently (200) instead of redirecting .html → clean URL (308 loop).
  const cleanPath = assetPath.replace(/\.html$/, '');
  const targetUrl = new URL(cleanPath, origin).toString();
  return env.ASSETS.fetch(new Request(targetUrl, originalRequest));
}

/**
 * Normalises the pathname: strips trailing slash unless it is the root "/".
 *
 * @param {string} pathname
 * @returns {string}
 */
function normalisePath(pathname) {
  if (pathname !== '/' && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export async function onRequest({ request, next, env }) {
  const url = new URL(request.url);
  const pathname = normalisePath(url.pathname);

  // /api/* — pass through to the api/ function handlers
  if (pathname.startsWith('/api/')) {
    return next();
  }

  // Clean-URL routes — serve HTML assets directly to bypass _redirects + Pretty URLs
  // interaction that causes redirect loops (especially in Safari).
  const CLEAN_URL_MAP = {
    '/pricing': '/pricing.html',
    '/login': '/login.html',
    '/signup': '/signup.html',
    '/dashboard': '/dashboard.html',
    '/admin': '/admin.html',
  };

  if (CLEAN_URL_MAP[pathname]) {
    return serveAsset(env, request, CLEAN_URL_MAP[pathname]);
  }

  // All other paths: default Pages asset serving
  return next();
}
