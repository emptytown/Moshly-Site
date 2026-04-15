import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { applyRateLimit, getClientIp, rateLimitedResponse } from './_rate-limit';
import { validatePassword } from './_password';
import { corsOptionsResponse } from './_cors';
import { sha256Hex } from './_email_utils';

export async function onRequestPost({ request, env }) {
  const db = drizzle(env.MOSHLY_DB);

  try {
    // Rate limit by IP first — before body parse — so malformed requests still count (F-11)
    const clientIp = getClientIp(request);
    const retryAfter = await applyRateLimit(env.AUTH_KV, 'reset-password', `ip:${clientIp}`);
    if (retryAfter) return rateLimitedResponse(retryAfter);

    let token, password;
    try {
      ({ token, password } = await request.json());
    } catch {
      return new Response(JSON.stringify({ 
        error: 'invalid_body',
        message: 'Invalid request body' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!token || !password) {
      return new Response(JSON.stringify({ 
        error: 'missing_fields',
        message: 'Token and password are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return new Response(JSON.stringify({ 
        error: 'invalid_password',
        message: passwordError 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Hash the incoming token — DB stores sha256(token), never the plain token
    const tokenHash = await sha256Hex(token);

    // Pre-check: validate hash exists before expensive bcrypt operation
    const existing = await db.select({ id: schema.users.id })
      .from(schema.users)
      .where(
        and(
          eq(schema.users.resetToken, tokenHash),
          gt(schema.users.resetExpires, new Date())
        )
      )
      .get();

    if (!existing) {
      return new Response(JSON.stringify({ 
        error: 'invalid_token',
        message: 'Invalid or expired reset token' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Atomic consume: UPDATE re-checks token hash at write time to prevent TOCTOU races.
    const result = await db.update(schema.users)
      .set({
        passwordHash,
        resetToken: null,
        resetExpires: null,
        emailVerified: true
      })
      .where(
        and(
          eq(schema.users.resetToken, tokenHash),
          gt(schema.users.resetExpires, new Date())
        )
      )
      .run();

    if (!result.meta?.changes || result.meta.changes === 0) {
      // Token was consumed by a concurrent request between pre-check and update
      return new Response(JSON.stringify({ 
        error: 'invalid_token',
        message: 'Invalid or expired reset token' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Invalidate ALL active sessions by writing a revocation timestamp.
    // The refresh endpoint compares each token's issuedAt against this value;
    // any token issued before the reset is rejected — covers every device,
    // not just the last one that was tracked by the old single-slot index.
    // TTL is 8 days — longer than the 7-day refresh token lifetime — so no
    // pre-reset token can outlive the revocation record.
    if (env.AUTH_KV) {
      await env.AUTH_KV.put(`rv:${existing.id}`, String(Date.now()), { expirationTtl: 8 * 24 * 3600 });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Password reset successful'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Reset password error:', error.message);
    return new Response(JSON.stringify({ 
      error: 'server_error',
      message: 'An internal server error occurred' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const onRequestOptions = ({ request }) => corsOptionsResponse(request, 'POST, OPTIONS');
