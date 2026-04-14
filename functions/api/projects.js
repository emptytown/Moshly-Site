import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import { verifyJWT } from './_middleware_auth';
import { eq, and } from 'drizzle-orm';
import { corsOptionsResponse } from './_cors';

export async function onRequestPost({ request, env }) {
  const payload = await verifyJWT(request, env);
  if (!payload) {
    return new Response(JSON.stringify({ 
      error: 'unauthorized',
      message: 'Unauthorized' 
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const db = drizzle(env.MOSHLY_DB);

  try {
    const body = await request.json();
    const { name, type, genre, location, description, notes, aiContextRules, extraFields, team } = body;

    if (!name || !type) {
      return new Response(JSON.stringify({ 
        error: 'missing_fields',
        message: 'Name and Type are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the user's workspace
    const workspace = await db.select()
      .from(schema.workspaces)
      .where(eq(schema.workspaces.ownerId, payload.userId))
      .get();

    if (!workspace) {
      return new Response(JSON.stringify({ 
        error: 'workspace_not_found',
        message: 'Workspace not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const projectId = crypto.randomUUID();
    
    await db.insert(schema.projects).values({
      id: projectId,
      workspaceId: workspace.id,
      ownerId: payload.userId,
      name,
      type,
      genre,
      location,
      description,
      notes,
      aiContextRules: aiContextRules ? JSON.stringify(aiContextRules) : null,
      extraFields: extraFields ? JSON.stringify(extraFields) : null,
      team: team ? JSON.stringify(team) : null,
    }).run();

    return new Response(JSON.stringify({ success: true, project: { id: projectId, name } }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Create project error:', error);
    return new Response(JSON.stringify({ 
      error: 'server_error',
      message: 'Server error creating project' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestGet({ request, env }) {
  const payload = await verifyJWT(request, env);
  if (!payload) {
    return new Response(JSON.stringify({ 
      error: 'unauthorized',
      message: 'Unauthorized' 
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const db = drizzle(env.MOSHLY_DB);

  try {
    const results = await db.select()
      .from(schema.projects)
      .where(eq(schema.projects.ownerId, payload.userId))
      .all();

    return new Response(JSON.stringify({ success: true, projects: results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Fetch projects error:', error);
    return new Response(JSON.stringify({ 
      error: 'server_error',
      message: 'Server error fetching projects' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const onRequestOptions = ({ request }) => corsOptionsResponse(request, 'GET, POST, OPTIONS');
