import { verifyJWT } from '../_middleware_auth';

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

/**
 * Admin endpoints are for `god` accounts only. The JWT role is checked first,
 * then the role is re-read from the database, so a demoted account loses access
 * straight away instead of when its 15-minute token runs out.
 * Returns { admin } on success, or { response } to send back as is.
 */
export async function requireGod(request, env) {
  const payload = await verifyJWT(request, env);
  if (!payload) return { response: json({ error: 'unauthorized', message: 'Log in first.' }, 401) };
  if (payload.role !== 'god') return { response: json({ error: 'forbidden', message: 'Forbidden' }, 403) };

  const row = await env.MOSHLY_DB
    .prepare('SELECT id, role FROM users WHERE id = ?')
    .bind(payload.userId)
    .first();
  if (!row || row.role !== 'god') return { response: json({ error: 'forbidden', message: 'Forbidden' }, 403) };

  return { admin: { userId: payload.userId, email: payload.email } };
}
