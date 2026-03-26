import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

export async function onRequestPost({ request, env }) {
  const db = drizzle(env.MOSHLY_DB);
  
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Find user
    const user = await db.select().from(schema.users).where(schema.users.email.eq(email)).get();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch workspace and plan
    const workspace = await db.select().from(schema.workspaces).where(schema.workspaces.ownerId.eq(user.id)).get();
    const subscription = workspace ? await db.select().from(schema.subscriptions).where(schema.subscriptions.workspaceId.eq(workspace.id)).get() : null;

    // Generate JWT
    const secret = new TextEncoder().encode(env.JWT_SECRET || 'dev_secret_moshly');
    const token = await new SignJWT({ 
        userId: user.id,
        email: user.email,
        role: user.role,
        plan: subscription?.plan || 'free'
      })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('72h')
      .sign(secret);

    return new Response(JSON.stringify({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: subscription?.plan || 'free'
      },
      token 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ error: 'Server error during login' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
