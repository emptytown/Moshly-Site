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

    // Fetch fresh user + subscription data
    const db = drizzle(env.MOSHLY_DB);

    const userRecord = await db
      .select({ id: schema.users.id, email: schema.users.email, role: schema.users.role })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .get();

    if (!userRecord) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const workspaceRecord = await db
      .select({ id: schema.workspaces.id })
      .from(schema.workspaces)
      .where(eq(schema.workspaces.ownerId, userId))
      .get();

    const subscriptionRecord = workspaceRecord
      ? await db
          .select({ plan: schema.subscriptions.plan })
          .from(schema.subscriptions)
          .where(eq(schema.subscriptions.workspaceId, workspaceRecord.id))
          .get()
      : null;

    // Issue new access token (15 min — per OWASP-JWT-001)
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const newAccessToken = await new SignJWT({
      userId: userRecord.id,
      email: userRecord.email,
      role: userRecord.role,
      plan: subscriptionRecord?.plan || 'free',
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
      JSON.stringify({ userId: userRecord.id }),
      { expirationTtl: 7 * 24 * 3600 }
    );

    return new Response(
      JSON.stringify({ success: true, token: newAccessToken, refreshToken: newRefreshToken }),
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
