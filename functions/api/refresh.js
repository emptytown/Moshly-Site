import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import { SignJWT } from 'jose';
import { eq } from 'drizzle-orm';

export async function onRequestPost({ request, env }) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return new Response(JSON.stringify({ error: 'Refresh token is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!env.AUTH_KV) {
      throw new Error('CRITICAL: AUTH_KV binding is not configured');
    }
    if (!env.JWT_SECRET) {
      throw new Error('CRITICAL: JWT_SECRET environment variable is not configured');
    }

    // Look up refresh token in KV
    const storedValue = await env.AUTH_KV.get(`rt:${refreshToken}`);
    if (!storedValue) {
      return new Response(JSON.stringify({ error: 'Invalid or expired refresh token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { userId } = JSON.parse(storedValue);

    // Rotate: delete old token immediately before issuing new one
    await env.AUTH_KV.delete(`rt:${refreshToken}`);

    // Fetch fresh user + profile + subscription in a single JOIN
    const db = drizzle(env.MOSHLY_DB);

    const refreshResult = await db
      .select({
        user: schema.users,
        profile: schema.profiles,
        subscription: schema.subscriptions,
      })
      .from(schema.users)
      .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.users.id))
      .leftJoin(schema.workspaces, eq(schema.workspaces.ownerId, schema.users.id))
      .leftJoin(schema.subscriptions, eq(schema.subscriptions.workspaceId, schema.workspaces.id))
      .where(eq(schema.users.id, userId))
      .get();

    if (!refreshResult?.user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { user, profile, subscription } = refreshResult;

    // Issue new access token (15 min — per OWASP-JWT-001)
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const newAccessToken = await new SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      plan: subscription?.plan || 'free',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer('moshly')
      .setAudience('moshly-api')
      .setExpirationTime('15m')
      .sign(secret);

    // Issue new refresh token (rotation — 7 days)
    const newRefreshToken = crypto.randomUUID();
    await env.AUTH_KV.put(
      `rt:${newRefreshToken}`,
      JSON.stringify({ userId: user.id }),
      { expirationTtl: 7 * 24 * 3600 }
    );

    return new Response(
      JSON.stringify({
        success: true,
        token: newAccessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          plan: subscription?.plan || 'free',
          jobTitle: profile?.jobTitle || null,
          organization: profile?.organization || null,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Refresh token error:', error.message);
    return new Response(JSON.stringify({ error: 'Server error during token refresh' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
