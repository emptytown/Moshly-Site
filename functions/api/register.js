import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import bcrypt from 'bcryptjs';
import { eq, and, gt, sql } from 'drizzle-orm';
import { applyRateLimit, getClientIp, rateLimitedResponse } from './_rate-limit';
import { validatePassword } from './_password';
import { corsOptionsResponse } from './_cors';
import { PLAN_LIMITS, GOD_TIER_PLANS, SUBSCRIPTION_PLANS } from './_plans';

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

    // Check if user exists — return same response as success to prevent user enumeration
    const existing = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).get();
    if (existing) {
      return new Response(JSON.stringify({
        success: true,
        message: 'If this email is not already registered, your account has been created.'
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();
    const workspaceId = crypto.randomUUID();
    const slug = email.split('@')[0].toLowerCase() + '-' + crypto.randomUUID().substring(0, 6);

    // Create user, workspace, and subscription atomically
    const batchOps = [
      db.insert(schema.users).values({
        id: userId,
        email,
        passwordHash,
        name,
        role: userRole,
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

    // Increment invite code usage atomically with user creation
    if (resolvedCode) {
      batchOps.push(
        db.update(schema.inviteCodes)
          .set({ usesCount: sql`${schema.inviteCodes.usesCount} + 1` })
          .where(eq(schema.inviteCodes.code, resolvedCode.code))
      );
    }

    await db.batch(batchOps);

    // Send Welcome Email via Resend
    const apiKey = env.RESEND_API_KEY;
    const fromEmail = env.RESEND_FROM_EMAIL || 'Moshly <hello@moshly.io>';

    if (apiKey) {
      try {
        const safeName = (name || 'there').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        const dashboardUrl = `${new URL(request.url).origin}/dashboard.html`;
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [email],
            subject: 'Welcome to Moshly',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #333;">Welcome to Moshly!</h2>
                <p>Hello ${safeName},</p>
                <p>Thanks for joining Moshly. Your account is now active and your workspace is ready.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${dashboardUrl}" style="background-color: #6b5cff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
                </div>
                <p>We're excited to have you on board!</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #888;">&copy; 2026 Moshly. All rights reserved.</p>
              </div>
            `,
            text: `Welcome to Moshly!\n\nHello ${name || 'there'},\n\nThanks for joining Moshly. Your account is now active and your workspace is ready.\n\nGo to your dashboard: ${dashboardUrl}\n\nWe're excited to have you on board!\n\n© 2026 Moshly.`
          })
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Registration succeeds even if welcome email fails
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'If this email is not already registered, your account has been created.'
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
