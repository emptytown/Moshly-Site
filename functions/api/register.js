import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import bcrypt from 'bcryptjs';
import { eq, and, sql } from 'drizzle-orm';
import { applyRateLimit, getClientIp, rateLimitedResponse } from './_rate-limit';
import { validatePassword } from './_password';
import { corsOptionsResponse } from './_cors';
import { PLAN_LIMITS, GOD_TIER_PLANS, SUBSCRIPTION_PLANS } from './_plans';
import { sha256Hex, sendVerificationEmail, resendVerification } from './_email_utils';

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({
        error: 'invalid_email',
        message: 'Invalid email format'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Normalize before any DB operations so stored email is always canonical.
    email = email.toLowerCase().trim();

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

    // Email rate limit — after parsing, dual-keyed per OWASP-RATELIMIT-001
    const emailRetryAfter = await applyRateLimit(env.AUTH_KV, 'register', `email:${email}`);
    if (emailRetryAfter) return rateLimitedResponse(emailRetryAfter);

    // Hash password — compute once for both fresh signups and unverified re-registrations
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if user exists
    const existing = await db.select().from(schema.users).where(eq(schema.users.email, email)).get();
    if (existing) {
      if (!existing.emailVerified) {
        // Handle unverified user (Scenario "Filipe")
        // We update their name/password too in case they made a typo or forgot it
        await db.update(schema.users)
          .set({ 
            name: name || existing.name,
            passwordHash: passwordHash
          })
          .where(eq(schema.users.id, existing.id))
          .run();

        await resendVerification(db, request, env, { ...existing, name: name || existing.name });

        return new Response(JSON.stringify({
          error: 'email_unverified',
          message: 'Account already exists but is not verified. We’ve sent you a new confirmation email. Please confirm your account using the latest email.'
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        // Handle verified user (Scenario "Registered")
        return new Response(JSON.stringify({
          error: 'email_exists',
          message: 'An account with this email already exists. Log in here or reset password.'
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Validate invite code if provided (read-only — claim happens AFTER user creation)
    let resolvedCode = null;
    let normalizedInviteCode = null;
    if (inviteCode) {
      normalizedInviteCode = String(inviteCode).toUpperCase().trim();
      const codeRecord = await db.select()
        .from(schema.inviteCodes)
        .where(eq(schema.inviteCodes.code, normalizedInviteCode))
        .get();

      if (!codeRecord) {
        return new Response(JSON.stringify({
          error: 'invalid_invite_code',
          message: 'The invite code you entered is invalid.'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      if (codeRecord.expiresAt && codeRecord.expiresAt < new Date()) {
        return new Response(JSON.stringify({
          error: 'invite_code_expired',
          message: 'This invite code has expired and can no longer be used.'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      if (codeRecord.usesCount >= codeRecord.maxUses) {
        return new Response(JSON.stringify({
          error: 'invite_code_max_uses',
          message: 'This invite code has already reached its maximum number of uses.'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      resolvedCode = codeRecord;
      // Do NOT claim the code here — the atomic claim happens after db.batch() so
      // a failed user creation cannot permanently burn a use slot.
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

    const userId = crypto.randomUUID();
    const workspaceId = crypto.randomUUID();
    const slug = email.split('@')[0].toLowerCase() + '-' + crypto.randomUUID().substring(0, 6);

    // Generate verification token
    const verificationToken = crypto.randomUUID();
    const verificationTokenHash = await sha256Hex(verificationToken);
    const verificationExpires = new Date(Date.now() + 3600000); // 1 hour

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
        verificationExpires: verificationExpires,
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

    await db.batch(batchOps);

    // Atomically claim one invite code use NOW — after user creation succeeds.
    // Doing it here means a failed batch can never burn a use slot.
    // The conditional WHERE guard closes the TOCTOU window between the read-
    // only validation above and this write.
    if (resolvedCode) {
      const claimResult = await db.update(schema.inviteCodes)
        .set({ usesCount: sql`${schema.inviteCodes.usesCount} + 1` })
        .where(and(
          eq(schema.inviteCodes.code, normalizedInviteCode),
          sql`uses_count < max_uses`
        ))
        .run();

      if (!claimResult.meta.changes) {
        // Extremely rare: another request exhausted the last use in the window
        // between our read-check and this write. Roll back the user we just created.
        await db.batch([
          db.delete(schema.subscriptions).where(eq(schema.subscriptions.workspaceId, workspaceId)),
          db.delete(schema.workspaces).where(eq(schema.workspaces.id, workspaceId)),
          db.delete(schema.users).where(eq(schema.users.id, userId)),
        ]);
        return new Response(JSON.stringify({
          error: 'invite_code_max_uses',
          message: 'This invite code has already reached its maximum number of uses.'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

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
    return new Response(JSON.stringify({ 
      error: 'server_error',
      message: 'An unexpected error occurred during registration. Please try again later.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const onRequestOptions = ({ request }) => corsOptionsResponse(request, 'POST, OPTIONS');
