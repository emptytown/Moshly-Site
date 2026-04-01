import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { applyRateLimit, getClientIp, rateLimitedResponse } from './_rate-limit';

async function sha256Hex(input) {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost({ request, env }) {
  const db = drizzle(env.MOSHLY_DB);

  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return new Response(JSON.stringify({ error: 'Token and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (password.length < 8) {
      return new Response(JSON.stringify({ error: 'Password must be at least 8 characters long' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Rate limit by IP to prevent token brute-forcing
    const clientIp = getClientIp(request);
    const retryAfter = await applyRateLimit(env.AUTH_KV, 'reset-password', `ip:${clientIp}`);
    if (retryAfter) return rateLimitedResponse(retryAfter);

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
      return new Response(JSON.stringify({ error: 'Invalid or expired reset token' }), {
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
        resetExpires: null
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
      return new Response(JSON.stringify({ error: 'Invalid or expired reset token' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
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
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
