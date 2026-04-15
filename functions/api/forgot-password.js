import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { applyRateLimit, getClientIp, rateLimitedResponse } from './_rate-limit';
import { corsOptionsResponse } from './_cors';

const RESEND_API_BASE = 'https://api.resend.com';

async function sha256Hex(input) {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost({ request, env }) {
  const db = drizzle(env.MOSHLY_DB);

  try {
    // IP rate limit first — before body parse — so malformed requests still count (F-11)
    const clientIp = getClientIp(request);
    const ipRetryAfter = await applyRateLimit(env.AUTH_KV, 'forgot-password', `ip:${clientIp}`);
    if (ipRetryAfter) return rateLimitedResponse(ipRetryAfter);

    let email;
    try {
      ({ email } = await request.json());
    } catch {
      return new Response(JSON.stringify({ 
        error: 'invalid_body',
        message: 'Invalid request body' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!email) {
      return new Response(JSON.stringify({ 
        error: 'missing_fields',
        message: 'Email is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Email rate limit — after parsing, to prevent email bombing
    const emailRetryAfter = await applyRateLimit(env.AUTH_KV, 'forgot-password', `email:${email.toLowerCase()}`);
    if (emailRetryAfter) return rateLimitedResponse(emailRetryAfter);

    // Check if user exists
    const user = await db.select({ 
      id: schema.users.id
    }).from(schema.users).where(eq(schema.users.email, email)).get();

    // Always return success to prevent user enumeration
    // Only proceed if user exists
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
      const origin = new URL(request.url).origin;
      const resetLink = `${origin}/reset-password.html?token=${resetToken}`;
      const logoUrl = `${origin}/assets/Moshly-Main-Logo-1.svg`;

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
            <div style="margin:0;padding:32px 16px;background-color:#0E0F14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <div style="max-width:600px;margin:0 auto;background:#1B1E2E;border:1px solid #2D3048;border-radius:16px;overflow:hidden;box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);">
                <div style="padding:32px;text-align:center;border-bottom:1px solid #2D3048;background:#141624;">
                  <img src="${logoUrl}" alt="Moshly" style="height:32px;margin-bottom:12px;" />
                </div>
                <div style="padding:40px 32px;">
                  <h2 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#E6E7EB;line-height:1.3;text-align:center;">Password Reset Request</h2>
                  <p style="margin:0 0 24px;font-size:16px;color:#A4A7B5;line-height:1.7;text-align:center;">
                    We received a request to reset your Moshly password. Click the button below to choose a new one:
                  </p>
                  <div style="text-align:center;margin:32px 0;">
                    <a href="${resetLink}" style="display:inline-block;background-color:#6B5CFF;color:#FFFFFF;padding:14px 28px;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;box-shadow: 0 4px 12px rgba(107, 92, 255, 0.3);">Reset Password</a>
                  </div>
                  <p style="margin:24px 0 0;font-size:14px;color:#7B7F93;line-height:1.6;text-align:center;">
                    This link will expire in 1 hour.<br/>
                    If you didn't request this, you can safely ignore this email.
                  </p>
                </div>
                <div style="padding:24px 32px;border-top:1px solid #2D3048;background:#141624;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#7B7F93;letter-spacing:0.02em;">
                    © 2026 Moshly · <a href="${origin}" style="color:#6B5CFF;text-decoration:none;">moshly.io</a>
                  </p>
                </div>
              </div>
            </div>
          `,
          text: `Reset your Moshly password by visiting this link: ${resetLink}\n\nThis link will expire in 1 hour.\n\n© 2026 Moshly · moshly.io`
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
