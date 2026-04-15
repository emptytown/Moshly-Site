import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { corsOptionsResponse } from './_cors';
import { sha256Hex, resendVerification } from './_email_utils';
import { applyRateLimit, getClientIp, rateLimitedResponse } from './_rate-limit';

export async function onRequestPost({ request, env }) {
  const db = drizzle(env.MOSHLY_DB);

  try {
    const clientIp = getClientIp(request);
    const ipRetryAfter = await applyRateLimit(env.AUTH_KV, 'verify-email', `ip:${clientIp}`);
    if (ipRetryAfter) return rateLimitedResponse(ipRetryAfter);

    const { token } = await request.json();

    if (!token) {
      return new Response(JSON.stringify({ 
        error: 'missing_token',
        message: 'Verification token is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const tokenHash = await sha256Hex(token);

    const user = await db.select()
      .from(schema.users)
      .where(eq(schema.users.verificationToken, tokenHash))
      .get();

    if (!user) {
      return new Response(JSON.stringify({ 
        error: 'invalid_token',
        message: 'Invalid or expired verification token' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Case C: Email already confirmed
    if (user.emailVerified) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Your email has been successfully confirmed. You can now log in.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date();
    if (user.verificationExpires && user.verificationExpires < now) {
      // Case B: Token expired, send a new one automatically
      await resendVerification(db, request, env, user);

      return new Response(JSON.stringify({ 
        error: 'token_expired',
        message: 'Your confirmation link has expired. We’ve sent you a new confirmation email. Please confirm your account using the latest email.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Case A: Valid and unconfirmed -> Confirm now
    await db.update(schema.users)
      .set({
        emailVerified: true,
        // We keep the verificationToken to allow the "Already confirmed" message 
        // on subsequent clicks, but we clear the expiration to avoid auto-resend.
        verificationExpires: null
      })
      .where(eq(schema.users.id, user.id))
      .run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Your email has been successfully confirmed. You can now log in.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Verification error:', error);
    return new Response(JSON.stringify({ 
      error: 'server_error',
      message: 'Server error during verification' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const onRequestOptions = ({ request }) => corsOptionsResponse(request, 'POST, OPTIONS');
