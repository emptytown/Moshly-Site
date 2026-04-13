import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import bcrypt from 'bcryptjs';
import { eq, and, sql } from 'drizzle-orm';
import { applyRateLimit, getClientIp, rateLimitedResponse } from './_rate-limit';
import { validatePassword } from './_password';
import { corsOptionsResponse } from './_cors';
import { PLAN_LIMITS, GOD_TIER_PLANS, SUBSCRIPTION_PLANS } from './_plans';

async function sha256Hex(input) {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost({ request, env }) {
  const db = drizzle(env.MOSHLY_DB);

  try {
    // Rate limit by IP first — before body parse — so malformed requests still count (F-11)
    const clientIp = getClientIp(request);
    const retryAfter = await applyRateLimit(env.AUTH_KV, 'register', `ip:${clientIp}`);
    if (retryAfter) return rateLimitedResponse(retryAfter);

    let email, password, name, inviteCode;
    try {
      ({ email, password, name, inviteCode } = await request.json());
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return new Response(JSON.stringify({ error: passwordError }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Email rate limit — after parsing, dual-keyed per OWASP-RATELIMIT-001
    const emailRetryAfter = await applyRateLimit(env.AUTH_KV, 'register', `email:${email.toLowerCase()}`);
    if (emailRetryAfter) return rateLimitedResponse(emailRetryAfter);

    // Check if user exists
    const existing = await db.select().from(schema.users).where(eq(schema.users.email, email)).get();
    if (existing) {
      if (!existing.emailVerified) {
        // Handle unverified user (Scenario "Filipe")
        const verificationToken = crypto.randomUUID();
        const verificationTokenHash = await sha256Hex(verificationToken);

        await db.update(schema.users)
          .set({ verificationToken: verificationTokenHash })
          .where(eq(schema.users.id, existing.id))
          .run();

        // Send Verification Email
        await sendVerificationEmail(request, env, email, existing.name, verificationToken);

        return new Response(JSON.stringify({
          error: 'email_unverified',
          message: 'Account already exists but is not verified. A new confirmation email has been sent!'
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        // Handle verified user (Scenario "Registered")
        return new Response(JSON.stringify({
          error: 'email_exists',
          message: 'An account with this email already exists.'
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Validate invite code if provided
    let resolvedCode = null;
    if (inviteCode) {
      const normalizedCode = String(inviteCode).toUpperCase().trim();
      const codeRecord = await db.select()
        .from(schema.inviteCodes)
        .where(eq(schema.inviteCodes.code, normalizedCode))
        .get();

      if (!codeRecord) {
        return new Response(JSON.stringify({ error: 'Invalid invite code' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      if (codeRecord.expiresAt && codeRecord.expiresAt < new Date()) {
        return new Response(JSON.stringify({ error: 'This invite code has expired' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      if (codeRecord.usesCount >= codeRecord.maxUses) {
        return new Response(JSON.stringify({ error: 'This invite code has reached its maximum uses' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      resolvedCode = codeRecord;

      // Atomically claim one use: only succeeds if usesCount is still below maxUses.
      // This closes the TOCTOU window between the check above and the batch insert below.
      // sql`uses_count < max_uses` compares the two DB columns so the guard is evaluated
      // inside the same atomic UPDATE statement.
      const claimResult = await db.update(schema.inviteCodes)
        .set({ usesCount: sql`${schema.inviteCodes.usesCount} + 1` })
        .where(and(
          eq(schema.inviteCodes.code, normalizedCode),
          sql`uses_count < max_uses`
        ))
        .run();

      if (!claimResult.meta.changes) {
        return new Response(JSON.stringify({ error: 'This invite code has reached its maximum uses' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Determine plan from invite code; default to free
    const isGodTier = resolvedCode && GOD_TIER_PLANS.has(resolvedCode.plan);
    const subscriptionPlan = resolvedCode
      ? (SUBSCRIPTION_PLANS.has(resolvedCode.plan) ? resolvedCode.plan : 'major')
      : 'free';
    const userRole = isGodTier ? 'god' : 'user';
    const limits = PLAN_LIMITS[subscriptionPlan];

    // Compute subscription expiry from invite code durationMonths (0 = eternal)
    let subscriptionExpiresAt = null;
    if (resolvedCode?.durationMonths > 0) {
      subscriptionExpiresAt = new Date();
      subscriptionExpiresAt.setMonth(subscriptionExpiresAt.getMonth() + resolvedCode.durationMonths);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();
    const workspaceId = crypto.randomUUID();
    const slug = email.split('@')[0].toLowerCase() + '-' + crypto.randomUUID().substring(0, 6);

    // Generate verification token
    const verificationToken = crypto.randomUUID();
    const verificationTokenHash = await sha256Hex(verificationToken);

    // Create user, workspace, and subscription atomically
    const batchOps = [
      db.insert(schema.users).values({
        id: userId,
        email,
        passwordHash,
        name,
        role: userRole,
        emailVerified: false,
        verificationToken: verificationTokenHash,
      }),
      db.insert(schema.workspaces).values({
        id: workspaceId,
        ownerId: userId,
        name: `${name || 'My'}'s Workspace`,
        slug,
      }),
      db.insert(schema.subscriptions).values({
        workspaceId,
        plan: subscriptionPlan,
        pdfExportsLimit: limits.pdfExportsLimit,
        aiCreditsLimit: limits.aiCreditsLimit,
        expiresAt: subscriptionExpiresAt,
      }),
    ];

    // Invite code use was already claimed atomically above — do not increment again here.

    await db.batch(batchOps);

    // Send Verification Email via Resend
    await sendVerificationEmail(request, env, email, name, verificationToken);

    return new Response(JSON.stringify({
      success: true,
      message: 'Account created! A confirmation link has been sent to your inbox.'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return new Response(JSON.stringify({ error: 'Server error during registration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const onRequestOptions = ({ request }) => corsOptionsResponse(request, 'POST, OPTIONS');

async function sendVerificationEmail(request, env, email, name, verificationToken) {
  const apiKey = env.RESEND_API_KEY;
  const fromEmail = env.RESEND_FROM_EMAIL || 'Moshly <hello@moshly.io>';

  if (!apiKey) return;

  try {
    const safeName = (name || 'there').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const origin = new URL(request.url).origin;
    const confirmUrl = `${origin}/confirm.html?token=${verificationToken}`;
    const logoUrl = `${origin}/assets/Moshly-Main-Logo-1.svg`;

    await fetch('https://api.resend.com/emails', {
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
  } catch (emailError) {
    console.error('Failed to send verification email:', emailError);
  }
}
