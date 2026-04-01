import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { applyRateLimit, getClientIp, rateLimitedResponse } from './_rate-limit';

export async function onRequestPost({ request, env }) {
  const db = drizzle(env.MOSHLY_DB);

  try {
    const { email, password, name } = await request.json();

    // Rate limit by IP to prevent mass account creation
    const clientIp = getClientIp(request);
    const retryAfter = await applyRateLimit(env.AUTH_KV, 'register', `ip:${clientIp}`);
    if (retryAfter) return rateLimitedResponse(retryAfter);

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

    if (password.length < 8) {
      return new Response(JSON.stringify({ error: 'Password must be at least 8 characters long' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
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

    // Create user, workspace, and subscription in a single batch
    await db.batch([
      db.insert(schema.users).values({
        id: userId,
        email,
        passwordHash,
        name,
      }),
      db.insert(schema.workspaces).values({
        id: workspaceId,
        ownerId: userId,
        name: `${name || 'My'}'s Workspace`,
        slug,
      }),
      db.insert(schema.subscriptions).values({
        workspaceId,
        plan: 'free',
        pdfExportsLimit: 1,
        aiCreditsLimit: 100,
      })
    ]);

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
        // We don't fail the registration if email fails
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
