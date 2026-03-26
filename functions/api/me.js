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
    const user = await db.select().from(schema.users).where(eq(schema.users.id, payload.userId)).get();
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const profile = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, user.id)).get();
    const workspace = await db.select().from(schema.workspaces).where(eq(schema.workspaces.ownerId, user.id)).get();
    const subscription = workspace ? await db.select().from(schema.subscriptions).where(eq(schema.subscriptions.workspaceId, workspace.id)).get() : null;

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
