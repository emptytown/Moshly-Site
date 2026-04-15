import { eq } from 'drizzle-orm';
import * as schema from '../db/schema';

export async function sha256Hex(input) {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function sendVerificationEmail(request, env, email, name, verificationToken) {
  const apiKey = env.RESEND_API_KEY;
  const fromEmail = env.RESEND_FROM_EMAIL || 'Moshly <hello@moshly.io>';

  if (!apiKey) {
    console.error('sendVerificationEmail: RESEND_API_KEY is not set — email not sent', { to: email });
    return false;
  }

  try {
    const safeName = (name || 'there').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const origin = new URL(request.url).origin;
    const confirmUrl = `${origin}/confirm.html?token=${verificationToken}`;
    const logoUrl = `${origin}/assets/Moshly-Main-Logo-1.svg`;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: 'Confirm your Moshly account',
        html: `
          <div style="margin:0;padding:32px 16px;background-color:#0E0F14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
            <div style="max-width:600px;margin:0 auto;background:#1B1E2E;border:1px solid #2D3048;border-radius:16px;overflow:hidden;box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);">
              <div style="padding:32px;text-align:center;border-bottom:1px solid #2D3048;background:#141624;">
                <img src="${logoUrl}" alt="Moshly" style="height:32px;margin-bottom:12px;" />
              </div>
              <div style="padding:40px 32px;">
                <h2 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#E6E7EB;line-height:1.3;text-align:center;">Welcome to Moshly!</h2>
                <p style="margin:0 0 16px;font-size:16px;color:#A4A7B5;line-height:1.7;">
                  Hello ${safeName},
                </p>
                <p style="margin:0 0 24px;font-size:16px;color:#A4A7B5;line-height:1.7;">
                  Thanks for joining Moshly. Please confirm your email address to activate your account:
                </p>
                <div style="text-align:center;margin:32px 0;">
                  <a href="${confirmUrl}" style="display:inline-block;background-color:#6B5CFF;color:#FFFFFF;padding:14px 28px;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;box-shadow: 0 4px 12px rgba(107, 92, 255, 0.3);">Confirm Account</a>
                </div>
                <p style="margin:24px 0 0;font-size:14px;color:#7B7F93;line-height:1.6;text-align:center;">
                  If you didn't sign up for Moshly, you can safely ignore this email.
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
        text: `Welcome to Moshly!\n\nHello ${name || 'there'},\n\nThanks for joining Moshly. Please confirm your email address to activate your account by visiting this link: ${confirmUrl}\n\nIf you didn't sign up for Moshly, you can safely ignore this email.\n\n© 2026 Moshly · moshly.io`
      })
    });

    if (!resendRes.ok) {
      const body = await resendRes.text();
      console.error('sendVerificationEmail: Resend API error', { status: resendRes.status, to: email, from: fromEmail, body });
      return false;
    }

    console.log('sendVerificationEmail: sent', { to: email });
    return true;
  } catch (emailError) {
    console.error('sendVerificationEmail: network error', { error: emailError.message, to: email });
    return false;
  }
}

/**
 * Centrally handle re-sending verification email.
 * Generates a new token, hashes it, updates the DB, and sends the email.
 */
export async function resendVerification(db, request, env, user) {
  const verificationToken = crypto.randomUUID();
  const verificationTokenHash = await sha256Hex(verificationToken);
  const verificationExpires = new Date(Date.now() + 3600000); // 1 hour

  await db.update(schema.users)
    .set({ 
      verificationToken: verificationTokenHash,
      verificationExpires: verificationExpires
    })
    .where(eq(schema.users.id, user.id))
    .run();

  await sendVerificationEmail(request, env, user.email, user.name, verificationToken);
  return true;
}
