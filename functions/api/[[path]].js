// Any /api/* address with no function of its own: 404 in JSON.
// Without this, Pages answers with the home page (200, HTML), and a caller
// that only checks the status thinks the request worked.
// Routes with their own file always take precedence over this catch-all.
export async function onRequest({ request }) {
  return new Response(JSON.stringify({
    error: 'not_found',
    path: new URL(request.url).pathname,
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
