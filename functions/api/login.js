import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { eq } from 'drizzle-orm';
import { applyRateLimit, getClientIp, rateLimitedResponse } from './_rate-limit';
import { getAllowedOrigin, corsOptionsResponse } from './_cors';

export async function onRequestPost({ request, env }) {
  const db = drizzle(env.MOSHLY_DB);

  try {
    // IP rate limit first — before body parse — so malformed requests still count (F-11)
    const clientIp = getClientIp(request);
    const ipRetryAfter = await applyRateLimit(env.AUTH_KV, 'login', `ip:${clientIp}`);
    if (ipRetryAfter) return rateLimitedResponse(ipRetryAfter);

    let email, password;
    try {
      ({ email, password } = await request.json());
    } catch {
      return new Response(JSON.stringify({ 
        error: 'invalid_body',
        message: 'Invalid request body' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!email || !password) {
      return new Response(JSON.stringify({
        error: 'missing_fields',
        message: 'Email and password are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Normalize early so DB query, rate limit key, and any downstream logic all
    // operate on the same canonical form.
    email = email.toLowerCase().trim();

    // Email rate limit — after parsing, dual-keyed per OWASP-RATELIMIT-001
    const emailRetryAfter = await applyRateLimit(env.AUTH_KV, 'login', `email:${email}`);
    if (emailRetryAfter) return rateLimitedResponse(emailRetryAfter);

    // Find user with profile, workspace, and subscription using JOINs
    const loginResult = await db.select({
      user: schema.users,
      profile: schema.profiles,
      workspace: schema.workspaces,
      subscription: schema.subscriptions
    })
    .from(schema.users)
    .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.users.id))
    .leftJoin(schema.workspaces, eq(schema.workspaces.ownerId, schema.users.id))
    .leftJoin(schema.subscriptions, eq(schema.subscriptions.workspaceId, schema.workspaces.id))
    .where(eq(schema.users.email, email))
    .get();

    if (!loginResult || !loginResult.user) {
      return new Response(JSON.stringify({ 
        error: 'invalid_credentials',
        message: 'No account found with that email. Please check your spelling or sign up.' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { user, profile, subscription } = loginResult;

    // Verify password FIRST — before checking verification status.
    // This prevents an attacker from learning whether an email is registered
    // (and whether it is verified) without first proving knowledge of the password.
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return new Response(JSON.stringify({
        error: 'invalid_credentials',
        message: 'The password you entered is incorrect. Please try again.'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if email is verified — only reachable with the correct password
    if (!user.emailVerified) {
      const now = new Date();
      const isExpired = !user.verificationExpires || user.verificationExpires < now;

      return new Response(JSON.stringify({
        error: isExpired ? 'email_validation_expired' : 'email_unverified',
        message: isExpired
          ? 'Your confirmation link has expired. Please use the "Forgot password?" link to regain access, or request a new confirmation email.'
          : 'Your account has not been confirmed yet. Please check your inbox and complete the verification.'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate JWT access token (15 min) with iss + aud claims
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

    // Issue refresh token (7 days) stored in KV.
    // issuedAt is recorded so the refresh endpoint can compare it against the
    // rv:{userId} revocation timestamp written by reset-password — this lets a
    // password reset invalidate ALL active sessions, not just the last one.
    const refreshToken = crypto.randomUUID();
    const RT_TTL = 7 * 24 * 3600;
    if (env.AUTH_KV) {
      await env.AUTH_KV.put(
        `rt:${refreshToken}`,
        JSON.stringify({ userId: user.id, issuedAt: Date.now() }),
        { expirationTtl: RT_TTL }
      );
    }

    const isSecure = new URL(request.url).protocol === 'https:';
    const refreshCookie = `moshly_rt=${refreshToken}; HttpOnly${isSecure ? '; Secure' : ''}; SameSite=Strict; Path=/api; Max-Age=604800`;

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: subscription?.plan || 'free',
        profile: profile ? { firstName: profile.firstName, lastName: profile.lastName, jobTitle: profile.jobTitle, organization: profile.organization, bio: profile.bio, skills: profile.skills, location: profile.location } : null,        subscription: subscription ? {
          plan: subscription.plan,
          pdfExportsLimit: subscription.pdfExportsLimit,
          pdfExportsUsed: subscription.pdfExportsUsed,
          aiCreditsLimit: subscription.aiCreditsLimit,
          aiCreditsUsed: subscription.aiCreditsUsed,
          expiresAt: subscription.expiresAt,
        } : null,
      },
      token: accessToken,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': refreshCookie,
      }
    });

  } catch (error) {
    console.error('Login error:', error.message);
    return new Response(JSON.stringify({ 
      error: 'server_error',
      message: 'Server error during login' 
    }), {
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
