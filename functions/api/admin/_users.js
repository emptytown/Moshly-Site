// Shared SQL and shaping for the admin user endpoints.

export const USER_SELECT = `
  SELECT u.id, u.name, u.email, u.role, u.email_verified, u.created_at,
         p.first_name, p.last_name, p.job_title, p.organization, p.location, p.connected_apps,
         w.id AS workspace_id,
         s.plan, s.expires_at, s.ai_credits_used, s.ai_credits_limit, s.pdf_exports_used, s.pdf_exports_limit,
         (SELECT COUNT(*) FROM projects pr WHERE pr.owner_id = u.id) AS project_count
  FROM users u
  LEFT JOIN profiles p      ON p.user_id = u.id
  LEFT JOIN workspaces w    ON w.owner_id = u.id
  LEFT JOIN subscriptions s ON s.workspace_id = w.id`;

const iso = (seconds) => (seconds ? new Date(seconds * 1000).toISOString() : null);

function parseApps(value) {
  try {
    const apps = JSON.parse(value || '[]');
    return Array.isArray(apps) ? apps : [];
  } catch {
    return [];
  }
}

export function shapeUser(r) {
  const fullName = [r.first_name, r.last_name].filter(Boolean).join(' ').trim();
  return {
    id: r.id,
    name: fullName || r.name || '',
    accountName: r.name || '',
    email: r.email,
    role: r.role,
    emailVerified: !!r.email_verified,
    joinedAt: iso(r.created_at),
    plan: r.plan || 'free',
    planEndsAt: iso(r.expires_at),
    hasWorkspace: !!r.workspace_id,
    usage: {
      aiCredits: { used: r.ai_credits_used ?? 0, limit: r.ai_credits_limit ?? 0 },
      pdfExports: { used: r.pdf_exports_used ?? 0, limit: r.pdf_exports_limit ?? 0 },
    },
    projectCount: r.project_count ?? 0,
    apps: parseApps(r.connected_apps),
    profile: {
      jobTitle: r.job_title || '',
      organization: r.organization || '',
      location: r.location || '',
    },
  };
}
