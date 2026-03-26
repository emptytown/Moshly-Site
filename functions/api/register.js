import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import bcrypt from 'bcryptjs';

export async function onRequestPost({ request, env }) {
  const db = drizzle(env.MOSHLY_DB);
  
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user exists
    const existing = await db.select().from(schema.users).where(schema.users.email.eq(email)).get();
    if (existing) {
      return new Response(JSON.stringify({ error: 'User already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    // Create user
    await db.insert(schema.users).values({
      id: userId,
      email,
      passwordHash,
      name,
    }).execute();

    // Create default workspace
    const workspaceId = crypto.randomUUID();
    const slug = email.split('@')[0].toLowerCase() + '-' + Math.random().toString(36).substring(2, 5);
    
    await db.insert(schema.workspaces).values({
      id: workspaceId,
      ownerId: userId,
      name: `${name || 'My'}'s Workspace`,
      slug,
    }).execute();

    // Create default subscription (Free)
    await db.insert(schema.subscriptions).values({
      workspaceId,
      plan: 'free',
      pdfExportsLimit: 1,
      aiCreditsLimit: 100,
    }).execute();

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'User registered successfully' 
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return new Response(JSON.stringify({ error: 'Server error during registration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
