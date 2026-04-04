import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import { verifyJWT } from './_middleware_auth';
import { eq } from 'drizzle-orm';
import { applyRateLimit, getClientIp, rateLimitedResponse } from './_rate-limit';
import { corsOptionsResponse } from './_cors';

const MAX_FIELD_LENGTH = 200;

export async function onRequestGet({ request, env }) {
  const payload = await verifyJWT(request, env);
  if (!payload) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const db = drizzle(env.MOSHLY_DB);
  
  try {
    const result = await db.select({
      user: schema.users,
      profile: schema.profiles,
      workspace: schema.workspaces,
      subscription: schema.subscriptions
    })
    .from(schema.users)
    .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.users.id))
    .leftJoin(schema.workspaces, eq(schema.workspaces.ownerId, schema.users.id))
    .leftJoin(schema.subscriptions, eq(schema.subscriptions.workspaceId, schema.workspaces.id))
    .where(eq(schema.users.id, payload.userId))
    .get();

    if (!result || !result.user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { user, profile, workspace, subscription } = result;

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        profile: profile ? {
          jobTitle: profile.jobTitle,
          organization: profile.organization,
          bio: profile.bio,
          skills: profile.skills,
          location: profile.location,
        } : null,
        subscription: subscription ? {
          plan: subscription.plan,
          pdfExportsLimit: subscription.pdfExportsLimit,
          pdfExportsUsed: subscription.pdfExportsUsed,
          aiCreditsLimit: subscription.aiCreditsLimit,
          aiCreditsUsed: subscription.aiCreditsUsed,
          expiresAt: subscription.expiresAt,
        } : null,
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Fetch user error:', error);
    return new Response(JSON.stringify({ error: 'Server error fetching profile' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPatch({ request, env }) {
  const payload = await verifyJWT(request, env);
  if (!payload) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Rate limit by IP after auth (F-05)
  const clientIp = getClientIp(request);
  const patchRetryAfter = await applyRateLimit(env.AUTH_KV, 'me-patch', `ip:${clientIp}`);
  if (patchRetryAfter) return rateLimitedResponse(patchRetryAfter);

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const name     = String(body.name                           || '').trim().slice(0, MAX_FIELD_LENGTH) || null;
  const jobTitle = String(body.job_title                      || '').trim().slice(0, MAX_FIELD_LENGTH) || null;
  const org      = String(body.organization || body.org       || '').trim().slice(0, MAX_FIELD_LENGTH) || null;
  const location = String(body.location                       || '').trim().slice(0, MAX_FIELD_LENGTH) || null;
  const skills   = String(body.skills                         || '').trim().slice(0, MAX_FIELD_LENGTH) || null;

  if (!name || !jobTitle || !org || !location) {
    return new Response(JSON.stringify({ error: 'Name, job title, organisation, and location are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const db = drizzle(env.MOSHLY_DB);

  try {
    await db.batch([
      db.update(schema.users)
        .set({ name })
        .where(eq(schema.users.id, payload.userId)),
      db.insert(schema.profiles)
        .values({ userId: payload.userId, jobTitle, organization: org, location, skills })
        .onConflictDoUpdate({
          target: schema.profiles.userId,
          set: { jobTitle, organization: org, location, skills },
        }),
    ]);

    console.info('Profile updated', { userId: payload.userId });

    return new Response(JSON.stringify({ success: true, user: { name, jobTitle, organization: org, location, skills } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Update profile error:', { error: error.message, userId: payload.userId });
    return new Response(JSON.stringify({ error: 'Server error updating profile' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const onRequestOptions = ({ request }) => corsOptionsResponse(request, 'GET, PATCH, OPTIONS');
