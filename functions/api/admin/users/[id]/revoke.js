import { requireGod, json } from '../../_guard';

// POST /api/admin/users/:id/revoke — signs the user out everywhere.
// Uses the same rv:{userId} marker as a password reset: every refresh token
// issued before now stops working. An access token already issued stays valid
// until it expires (15 minutes at most).
export async function onRequestPost({ request, env, params }) {
  const { admin, response } = await requireGod(request, env);
  if (response) return response;

  if (!env.AUTH_KV) return json({ error: 'server_error', message: 'Session store is not configured.' }, 500);

  const user = await env.MOSHLY_DB.prepare('SELECT id FROM users WHERE id = ?').bind(params.id).first();
  if (!user) return json({ error: 'not_found', message: 'User not found.' }, 404);

  await env.AUTH_KV.put(`rv:${params.id}`, String(Date.now()), { expirationTtl: 8 * 24 * 3600 });
  console.info('[admin] sessions revoked', { userId: params.id, by: admin.userId });
  return json({ success: true });
}
