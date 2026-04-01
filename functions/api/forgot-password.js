import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { applyRateLimit, getClientIp, rateLimitedResponse } from './_rate-limit';

const RESEND_API_BASE = 'https://api.resend.com';

async function sha256Hex(input) {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost({ request, env }) {
  const db = drizzle(env.MOSHLY_DB);

  try {
    const { email } = await request.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Rate limit by IP and by email to prevent email bombing
    const clientIp = getClientIp(request);
    const ipRetryAfter = await applyRateLimit(env.AUTH_KV, 'forgot-password', `ip:${clientIp}`);
    if (ipRetryAfter) return rateLimitedResponse(ipRetryAfter);

    const emailRetryAfter = await applyRateLimit(env.AUTH_KV, 'forgot-password', `email:${email.toLowerCase()}`);
    if (emailRetryAfter) return rateLimitedResponse(emailRetryAfter);

    // Check if user exists
    const user = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).get();

    // Always return success to prevent user enumeration
    if (!user) {
      return new Response(JSON.stringify({
        success: true,
        message: 'If an account exists with that email, a reset link has been sent.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate plain token (sent in email), store only its SHA-256 hash in DB
    const resetToken = crypto.randomUUID();
    const resetTokenHash = await sha256Hex(resetToken);
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await db.update(schema.users)
      .set({
        resetToken: resetTokenHash,
        resetExpires: expiresAt
      })
      .where(eq(schema.users.id, user.id))
      .run();

    // Email Integration
    const apiKey = env.RESEND_API_KEY;
    const fromEmail = env.RESEND_FROM_EMAIL || 'Moshly <auth@moshly.io>';

    if (apiKey) {
      const resetLink = `${new URL(request.url).origin}/reset-password.html?token=${resetToken}`;
      
      await fetch(`${RESEND_API_BASE}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: 'Reset your Moshly password',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #333;">Password Reset Request</h2>
              <p>Hello,</p>
              <p>We received a request to reset your Moshly password. Click the button below to choose a new one:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #6b5cff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
              </div>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request this, you can safely ignore this email.</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="font-size: 12px; color: #888;">&copy; 2026 Moshly. All rights reserved.</p>
            </div>
          `,
          text: `Reset your Moshly password by visiting this link: ${resetLink}\n\nThis link will expire in 1 hour.`
        })
      });
    } else {
      console.warn('RESEND_API_KEY not found, email not sent');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'If an account exists with that email, a reset link has been sent.' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
