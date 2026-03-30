/**
 * Global Pages Functions middleware.
 *
 * Routing logic:
 *   /              → launching-soon/index.html  (before LAUNCH_DATE)
 *                 → index.html                  (on/after LAUNCH_DATE)
 *   /dashboard    → dashboard.html
 *   /admin        → admin.html
 *   /api/*        → delegated to api/ function handlers
 *   everything else → default Pages asset serving
 */

// BP-CONST-001: named constant instead of inline literal date string
const LAUNCH_DATE = new Date('2025-05-01T00:00:00Z');

// BP-CONST-001: route map kept as a named constant, not scattered inline literals
const CLEAN_ROUTE_MAP = {
  '/dashboard': '/dashboard.html',
  '/admin': '/admin.html',
};

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
  const targetUrl = new URL(assetPath, origin).toString();
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

  // Clean-URL routes → serve the corresponding HTML asset
  const mappedAsset = CLEAN_ROUTE_MAP[pathname];
  if (mappedAsset) {
    return serveAsset(env, request, mappedAsset);
  }

  // Root path: serve based on whether launch date has passed
  if (pathname === '/') {
    const isPreLaunch = new Date() < LAUNCH_DATE;
    if (isPreLaunch) {
      return serveAsset(env, request, '/launching-soon/index.html');
    }
    // Post-launch: index.html is served by default Pages asset serving
    return next();
  }

  // All other paths: default Pages asset serving
  return next();
}
