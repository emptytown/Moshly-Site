/**
 * Global Pages Functions middleware.
 *
 * Routing logic:
 *   /api/*        → delegated to api/ function handlers
 *   everything else → default Pages asset serving (applies _redirects, Pretty URLs)
 */

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

export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  const pathname = normalisePath(url.pathname);

  // /api/* — pass through to the api/ function handlers
  if (pathname.startsWith('/api/')) {
    return next();
  }

  // All other paths: default Pages asset serving.
  // _redirects (200 rewrites) and Pretty URLs are applied by the Pages routing
  // layer here — NOT via env.ASSETS.fetch(), which triggers a _redirects +
  // Pretty URLs conflict that produces 308 self-redirects on /login, /pricing, etc.
  return next();
}
