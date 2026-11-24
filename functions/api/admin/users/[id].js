import { requireGod, json } from '../_guard';
import { USER_SELECT, shapeUser } from '../_users';

// GET /api/admin/users/:id — one user, with their projects.
export async function onRequestGet({ request, env, params }) {
  const { response } = await requireGod(request, env);
  if (response) return response;

  try {
    const row = await env.MOSHLY_DB.prepare(`${USER_SELECT} WHERE u.id = ?`).bind(params.id).first();
    if (!row) return json({ error: 'not_found', message: 'User not found.' }, 404);

    const projects = await env.MOSHLY_DB
      .prepare(`SELECT id, name, type, created_at, updated_at FROM projects WHERE owner_id = ? ORDER BY created_at DESC`)
      .bind(params.id)
      .all();

    return json({
      user: shapeUser(row),
      projects: projects.results.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        createdAt: p.created_at ? new Date(p.created_at * 1000).toISOString() : null,
        updatedAt: p.updated_at ? new Date(p.updated_at * 1000).toISOString() : null,
      })),
    });
  } catch (err) {
    console.error('[admin] user detail failed', { userId: params.id, error: err.message });
    return json({ error: 'server_error', message: 'Could not load this user.' }, 500);
  }
}
