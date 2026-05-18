import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '../../db/schema';
import { corsOptionsResponse } from '../_cors';

function tryParseJSON(value, fallback) {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: 'unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestGet({ request, env }) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token || !env.MOSHLY_INTERNAL_SECRET || token !== env.MOSHLY_INTERNAL_SECRET) {
    return unauthorizedResponse();
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId || typeof userId !== 'string') {
    return jsonResponse({ error: 'invalid_user_id' }, 400);
  }

  const db = drizzle(env.MOSHLY_DB);

  try {
    const results = await db.select()
      .from(schema.projects)
      .where(eq(schema.projects.ownerId, userId))
      .all();

    const projects = results.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      team: tryParseJSON(p.team, []),
      extraFields: tryParseJSON(p.extraFields, []),
      aiContextRules: tryParseJSON(p.aiContextRules, []),
    }));

    return jsonResponse({ success: true, projects });
  } catch (error) {
    console.error('[internal/projects] Fetch error:', { error: error.message, userId });
    return jsonResponse({ error: 'server_error' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return corsOptionsResponse(request, 'GET, OPTIONS');
}
