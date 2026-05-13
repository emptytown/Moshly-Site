import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import { SignJWT, importPKCS8 } from 'jose';
import { eq } from 'drizzle-orm';
import { applyRateLimit, getClientIp, rateLimitedResponse } from './_rate-limit';
import { corsOptionsResponse } from './_cors';
import { sha256Hex, sendVerificationEmail, resendVerification } from './_email_utils';

export async function onRequestPost({ request, env }) {
  try {
    // Rate limit by IP before any token work (F-04)
    const clientIp = getClientIp(request);
    const ipRetryAfter = await applyRateLimit(env.AUTH_KV, 'refresh', `ip:${clientIp}`);
    if (ipRetryAfter) return rateLimitedResponse(ipRetryAfter);

    const cookieHeader = request.headers.get('Cookie') || '';
    const match = cookieHeader.match(/(?:^|;\s*)moshly_rt=([^;]+)/);
    const refreshToken = match?.[1];

    if (!refreshToken) {
      return new Response(JSON.stringify({ 
        error: 'missing_token',
        message: 'Refresh token is required' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!env.AUTH_KV) {
      throw new Error('CRITICAL: AUTH_KV binding is not configured');
    }
    if (!env.JWT_PRIVATE_KEY) {
      throw new Error('CRITICAL: JWT_PRIVATE_KEY environment variable is not configured');
    }

    // Acquire a per-token lock before the get/delete sequence to prevent concurrent
    // replay of the same refresh token (F-03). KV has no atomic CAS, so this reduces
    // the race window to microseconds rather than eliminating it entirely.
    const lockKey = `rt:lock:${refreshToken}`;
    const existingLock = await env.AUTH_KV.get(lockKey);
    if (existingLock) {
      return new Response(JSON.stringify({ 
        error: 'refresh_conflict',
        message: 'Refresh in progress, please retry' 
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    await env.AUTH_KV.put(lockKey, '1', { expirationTtl: 60 });

    // Look up refresh token in KV
    const storedValue = await env.AUTH_KV.get(`rt:${refreshToken}`);
    if (!storedValue) {
      return new Response(JSON.stringify({ 
        error: 'invalid_token',
        message: 'Invalid or expired refresh token' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { userId, issuedAt } = JSON.parse(storedValue);

    // Revocation check: password reset writes rv:{userId} = timestamp.
    // Any token issued before that timestamp is invalid, regardless of which
    // device issued it — this covers all concurrent sessions uniformly.
    const rv = await env.AUTH_KV.get(`rv:${userId}`);
    if (rv) {
      const revokedAt = parseInt(rv, 10);
      // Tokens without issuedAt predate this fix and are conservatively revoked
      // once a password reset has occurred.
      if (!issuedAt || issuedAt < revokedAt) {
        await env.AUTH_KV.delete(`rt:${refreshToken}`);
        return new Response(JSON.stringify({
          error: 'session_revoked',
          message: 'Session was invalidated. Please log in again.'
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

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
      return new Response(JSON.stringify({ 
        error: 'user_not_found',
        message: 'User not found' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { user, profile, subscription } = refreshResult; 
    if (!user.emailVerified) {
      const now = new Date();
      if (user.verificationExpires && user.verificationExpires < now) {
        // Token expired, send a new one
        await resendVerification(db, request, env, user);

        return new Response(JSON.stringify({ 
          error: 'email_validation_expired',
          message: 'Your confirmation link has expired. We’ve sent you a new confirmation email. Please confirm your account using the latest email.' 
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ 
        error: 'email_unverified',
        message: 'Your confirmation link is still valid, but your account has not been confirmed yet. Please check your inbox and complete the verification.' 
      }), { 
        status: 403, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Issue new access token (15 min — per OWASP-JWT-001)
    const privateKey = await importPKCS8(env.JWT_PRIVATE_KEY, 'RS256');
    const newAccessToken = await new SignJWT({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: subscription?.plan || 'free',
    })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuedAt()
      .setIssuer('https://moshly.io')
      .setAudience('moshly-api')
      .setExpirationTime('15m')
      .sign(privateKey);

    // Issue new refresh token (rotation — 7 days).
    // issuedAt is carried forward so future revocation checks remain accurate.
    const newRefreshToken = crypto.randomUUID();
    const RT_TTL = 7 * 24 * 3600;
    await env.AUTH_KV.put(
      `rt:${newRefreshToken}`,
      JSON.stringify({ userId: user.id, issuedAt: Date.now() }),
      { expirationTtl: RT_TTL }
    );

    const isSecure = new URL(request.url).protocol === 'https:';
    const refreshCookie = `moshly_rt=${newRefreshToken}; HttpOnly${isSecure ? '; Secure' : ''}; SameSite=Strict; Path=/api; Max-Age=604800`;

    return new Response(
      JSON.stringify({
        success: true,
        token: newAccessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          plan: subscription?.plan || 'free',
          profile: profile ? {
              firstName: profile.firstName,
              lastName: profile.lastName,
              jobTitle: profile.jobTitle,
              organization: profile.organization,
              bio: profile.bio,
              skills: profile.skills,
              location: profile.location,
              uxSettings: profile.uxSettings ? JSON.parse(profile.uxSettings) : null,
              connectedApps: profile.connectedApps ? JSON.parse(profile.connectedApps) : [],
            } : { connectedApps: [], uxSettings: null },
          subscription: subscription ? {
            plan: subscription.plan,
            pdfExportsLimit: subscription.pdfExportsLimit,
            pdfExportsUsed: subscription.pdfExportsUsed,
            aiCreditsLimit: subscription.aiCreditsLimit,
            aiCreditsUsed: subscription.aiCreditsUsed,
            expiresAt: subscription.expiresAt,
          } : null,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Set-Cookie': refreshCookie } }
    );

  } catch (error) {
    console.error('Refresh token error:', error.message);
    return new Response(JSON.stringify({ 
      error: 'server_error',
      message: 'Server error during token refresh' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const onRequestOptions = ({ request }) => corsOptionsResponse(request, 'POST, OPTIONS');
