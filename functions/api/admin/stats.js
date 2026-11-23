import { requireGod, json } from './_guard';

// GET /api/admin/stats — headline numbers for the admin overview.
export async function onRequestGet({ request, env }) {
  const { response } = await requireGod(request, env);
  if (response) return response;

  const now = Math.floor(Date.now() / 1000);
  const day = 24 * 3600;

  try {
    const [totals, plans, projects] = await env.MOSHLY_DB.batch([
      env.MOSHLY_DB.prepare(`
        SELECT COUNT(*)                                   AS users,
               SUM(email_verified = 1)                    AS verified,
               SUM(created_at >= ?1 - 7 * ?2)             AS last7,
               SUM(created_at >= ?1 - 30 * ?2)            AS last30
        FROM users WHERE role <> 'god'`).bind(now, day),
      env.MOSHLY_DB.prepare(`
        SELECT COALESCE(s.plan, 'free') AS plan, COUNT(*) AS n
        FROM users u
        LEFT JOIN workspaces w ON w.owner_id = u.id
        LEFT JOIN subscriptions s ON s.workspace_id = w.id
        WHERE u.role <> 'god'
        GROUP BY 1`),
      env.MOSHLY_DB.prepare(`
        SELECT COUNT(*) AS projects, COUNT(DISTINCT owner_id) AS owners FROM projects`),
    ]);

    const t = totals.results[0] || {};
    const p = projects.results[0] || {};
    const byPlan = Object.fromEntries(plans.results.map(r => [r.plan, r.n]));
    const paid = Object.entries(byPlan).filter(([plan]) => plan !== 'free').reduce((sum, [, n]) => sum + n, 0);

    return json({
      users: t.users ?? 0,
      verified: t.verified ?? 0,
      signupsLast7Days: t.last7 ?? 0,
      signupsLast30Days: t.last30 ?? 0,
      paid,
      byPlan,
      projects: p.projects ?? 0,
      projectOwners: p.owners ?? 0,
    });
  } catch (err) {
    console.error('[admin] stats failed', { error: err.message });
    return json({ error: 'server_error', message: 'Could not load stats.' }, 500);
  }
}
