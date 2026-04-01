import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import { verifyJWT } from './_middleware_auth';
import { eq } from 'drizzle-orm';

export async function onRequestGet({ request, env }) {
  const payload = await verifyJWT(request, env);
  if (!payload) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const db = drizzle(env.MOSHLY_DB);
  
  try {
    const result = await db.select({
      user: schema.users,
      profile: schema.profiles,
      workspace: schema.workspaces,
      subscription: schema.subscriptions
    })
    .from(schema.users)
    .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.users.id))
    .leftJoin(schema.workspaces, eq(schema.workspaces.ownerId, schema.users.id))
    .leftJoin(schema.subscriptions, eq(schema.subscriptions.workspaceId, schema.workspaces.id))
    .where(eq(schema.users.id, payload.userId))
    .get();

    if (!result || !result.user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { user, profile, workspace, subscription } = result;

    return new Response(JSON.stringify({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        profile,
        subscription
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Fetch user error:', error);
    return new Response(JSON.stringify({ error: 'Server error fetching profile' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
