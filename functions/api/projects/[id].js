import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../../db/schema';
import { verifyJWT } from '../_middleware_auth';
import { eq, and } from 'drizzle-orm';
import { corsOptionsResponse } from '../_cors';

async function requireOwnership(db, projectId, userId) {
  const project = await db.select()
    .from(schema.projects)
    .where(and(eq(schema.projects.id, projectId), eq(schema.projects.ownerId, userId)))
    .get();
  return project || null;
}

export async function onRequestPatch({ request, env, params }) {
  const payload = await verifyJWT(request, env);
  if (!payload) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const db = drizzle(env.MOSHLY_DB);
  const projectId = params.id;

  const existing = await requireOwnership(db, projectId, payload.userId);
  if (!existing) {
    return new Response(JSON.stringify({ error: 'not_found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { name, type, genre, location, description, notes, team, extraFields, aiContextRules } = body;

    if (!name || !type) {
      return new Response(JSON.stringify({ error: 'missing_fields', message: 'Name and Type are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await db.update(schema.projects)
      .set({
        name, type, genre, location, description, notes,
        team:           team !== undefined           ? JSON.stringify(team)           : existing.team,
        extraFields:    extraFields !== undefined    ? JSON.stringify(extraFields)    : existing.extraFields,
        aiContextRules: aiContextRules !== undefined ? JSON.stringify(aiContextRules) : existing.aiContextRules,
      })
      .where(and(eq(schema.projects.id, projectId), eq(schema.projects.ownerId, payload.userId)))
      .run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Update project error:', error);
    return new Response(JSON.stringify({ error: 'server_error', message: 'Server error updating project' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestDelete({ request, env, params }) {
  const payload = await verifyJWT(request, env);
  if (!payload) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const db = drizzle(env.MOSHLY_DB);
  const projectId = params.id;

  const existing = await requireOwnership(db, projectId, payload.userId);
  if (!existing) {
    return new Response(JSON.stringify({ error: 'not_found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    await db.delete(schema.projects)
      .where(and(eq(schema.projects.id, projectId), eq(schema.projects.ownerId, payload.userId)))
      .run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Delete project error:', error);
    return new Response(JSON.stringify({ error: 'server_error', message: 'Server error deleting project' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const onRequestOptions = ({ request }) => corsOptionsResponse(request, 'PATCH, DELETE, OPTIONS');
