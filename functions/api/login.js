import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { eq } from 'drizzle-orm';
import { applyRateLimit, getClientIp, rateLimitedResponse } from './_rate-limit';
import { getAllowedOrigin } from './_cors';

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

    // Rate limit: by IP and by email (dual-keyed per OWASP-RATELIMIT-001)
    const clientIp = getClientIp(request);
    const ipRetryAfter = await applyRateLimit(env.AUTH_KV, 'login', `ip:${clientIp}`);
    if (ipRetryAfter) return rateLimitedResponse(ipRetryAfter);

    const emailRetryAfter = await applyRateLimit(env.AUTH_KV, 'login', `email:${email.toLowerCase()}`);
    if (emailRetryAfter) return rateLimitedResponse(emailRetryAfter);

    // Find user with workspace and subscription using JOINs
    const loginResult = await db.select({
      user: schema.users,
      workspace: schema.workspaces,
      subscription: schema.subscriptions
    })
    .from(schema.users)
    .leftJoin(schema.workspaces, eq(schema.workspaces.ownerId, schema.users.id))
    .leftJoin(schema.subscriptions, eq(schema.subscriptions.workspaceId, schema.workspaces.id))
    .where(eq(schema.users.email, email))
    .get();

    if (!loginResult || !loginResult.user) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { user, subscription } = loginResult;

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate JWT access token (30 min) with iss + aud claims
    if (!env.JWT_SECRET) {
      throw new Error('CRITICAL: JWT_SECRET environment variable is not set');
    }
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const accessToken = await new SignJWT({
        userId: user.id,
        email: user.email,
        role: user.role,
        plan: subscription?.plan || 'free'
      })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer('moshly')
      .setAudience('moshly-api')
      .setExpirationTime('15m')
      .sign(secret);

    // Issue refresh token (7 days) stored in KV
    const refreshToken = crypto.randomUUID();
    if (env.AUTH_KV) {
      await env.AUTH_KV.put(
        `rt:${refreshToken}`,
        JSON.stringify({ userId: user.id }),
        { expirationTtl: 7 * 24 * 3600 }
      );
    }

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: subscription?.plan || 'free'
      },
      token: accessToken,
      refreshToken,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Login error:', error.message);
    return new Response(JSON.stringify({ error: 'Server error during login' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestOptions({ request }) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': getAllowedOrigin(request),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
