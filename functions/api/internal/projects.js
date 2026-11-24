import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '../../db/schema';
import { corsOptionsResponse } from '../_cors';
import { authenticateApp, unauthorizedResponse, jsonResponse } from './_app-auth';

function tryParseJSON(value, fallback) {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

export async function onRequestGet({ request, env }) {
  // Same check as every internal route: per-app secret (KV) or MOSHLY_INTERNAL_SECRET.
  const caller = await authenticateApp(request, env);
  if (!caller) return unauthorizedResponse();

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
