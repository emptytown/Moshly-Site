import { requireGod, json } from './_guard';
import { USER_SELECT, shapeUser } from './_users';

const PAGE_SIZE = 25;
const FILTERS = {
  all: '1 = 1',
  verified: 'u.email_verified = 1',
  unverified: 'u.email_verified = 0',
  paid: "COALESCE(s.plan, 'free') <> 'free'",
  with_projects: 'EXISTS (SELECT 1 FROM projects pr WHERE pr.owner_id = u.id)',
};

// GET /api/admin/users?search=&filter=&page= — newest first, 25 per page.
export async function onRequestGet({ request, env }) {
  const { response } = await requireGod(request, env);
  if (response) return response;

  const url = new URL(request.url);
  const search = (url.searchParams.get('search') || '').trim().slice(0, 100);
  const filter = FILTERS[url.searchParams.get('filter')] ? url.searchParams.get('filter') : 'all';
  const page = Math.max(1, parseInt(url.searchParams.get('page'), 10) || 1);

  const where = [FILTERS[filter]];
  const binds = [];
  if (search) {
    // Escape LIKE wildcards so a search for "_" or "%" matches them literally.
    const like = `%${search.toLowerCase().replace(/[\\%_]/g, (c) => '\\' + c)}%`;
    where.push(`(LOWER(u.email) LIKE ? ESCAPE '\\' OR LOWER(COALESCE(u.name, '')) LIKE ? ESCAPE '\\'
                 OR LOWER(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')) LIKE ? ESCAPE '\\')`);
    binds.push(like, like, like);
  }
  const whereSql = `WHERE ${where.join(' AND ')}`;

  try {
    const [countRes, rowsRes] = await env.MOSHLY_DB.batch([
      env.MOSHLY_DB.prepare(`
        SELECT COUNT(*) AS total FROM users u
        LEFT JOIN profiles p      ON p.user_id = u.id
        LEFT JOIN workspaces w    ON w.owner_id = u.id
        LEFT JOIN subscriptions s ON s.workspace_id = w.id
        ${whereSql}`).bind(...binds),
      env.MOSHLY_DB.prepare(`${USER_SELECT} ${whereSql}
        ORDER BY u.created_at DESC LIMIT ? OFFSET ?`).bind(...binds, PAGE_SIZE, (page - 1) * PAGE_SIZE),
    ]);

    const total = countRes.results[0]?.total ?? 0;
    return json({
      users: rowsRes.results.map(shapeUser),
      total,
      page,
      pageSize: PAGE_SIZE,
      pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      filter,
      search,
    });
  } catch (err) {
    console.error('[admin] users list failed', { error: err.message });
    return json({ error: 'server_error', message: 'Could not load users.' }, 500);
  }
}
