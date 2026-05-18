/**
 * Authenticates a spoke app by looking up its Bearer token in KV.
 * KV key format: appsecret:<token> → appId (e.g. "quote", "rank")
 *
 * Returns the appId string, or null if the token is missing/invalid.
 * Each spoke has its own rotatable secret — rotating one doesn't affect others.
 */
export async function authenticateApp(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token || !env.AUTH_KV) return null;
  return await env.AUTH_KV.get(`appsecret:${token}`);
}

export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: 'unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
