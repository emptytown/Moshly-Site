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
    return new Response(JSON.stringify({ 
      error: 'unauthorized',
      message: 'Unauthorized' 
    }), {
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
      return new Response(JSON.stringify({ 
        error: 'user_not_found',
        message: 'User not found' 
      }), {
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
          firstName: profile.firstName,
          lastName: profile.lastName,
          jobTitle: profile.jobTitle,
          organization: profile.organization,
          bio: profile.bio,
          skills: profile.skills,
          location: profile.location,
          uxSettings: profile.uxSettings ? JSON.parse(profile.uxSettings) : null,
          connectedApps: profile.connectedApps ? JSON.parse(profile.connectedApps) : [],
        } : {
          connectedApps: [],
          uxSettings: null
        },
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
    return new Response(JSON.stringify({ 
      error: 'server_error',
      message: 'Server error fetching profile' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPatch({ request, env }) {
  const payload = await verifyJWT(request, env);
  if (!payload) {
    return new Response(JSON.stringify({ 
      error: 'unauthorized',
      message: 'Unauthorized' 
    }), {
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
    return new Response(JSON.stringify({ 
      error: 'invalid_body',
      message: 'Invalid request body' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const name      = body.name !== undefined ? String(body.name || '').trim().slice(0, MAX_FIELD_LENGTH) : undefined;
  const firstName = body.first_name !== undefined ? String(body.first_name || '').trim().slice(0, MAX_FIELD_LENGTH) : undefined;
  const lastName  = body.last_name !== undefined ? String(body.last_name || '').trim().slice(0, MAX_FIELD_LENGTH) : undefined;
  const jobTitle  = body.job_title !== undefined ? String(body.job_title || '').trim().slice(0, MAX_FIELD_LENGTH) : undefined;
  const org       = (body.organization !== undefined || body.org !== undefined) 
                    ? String(body.organization || body.org || '').trim().slice(0, MAX_FIELD_LENGTH) 
                    : undefined;
  const location  = body.location !== undefined ? String(body.location || '').trim().slice(0, MAX_FIELD_LENGTH) : undefined;
  const skills    = body.skills !== undefined ? String(body.skills || '').trim().slice(0, MAX_FIELD_LENGTH) : undefined;
  const avatarUrl = body.avatarUrl !== undefined ? String(body.avatarUrl).trim().slice(0, 2048) : undefined;
  const uxSettings = body.uxSettings !== undefined ? JSON.stringify(body.uxSettings) : undefined;
  const connectedApps = body.connectedApps !== undefined ? JSON.stringify(body.connectedApps) : undefined;

  const db = drizzle(env.MOSHLY_DB);

  try {
    const userUpdate = {};
    if (name !== undefined) userUpdate.name = name;
    if (avatarUrl !== undefined) userUpdate.avatarUrl = avatarUrl;

    const profileUpdate = {};
    if (firstName !== undefined) profileUpdate.firstName = firstName;
    if (lastName !== undefined) profileUpdate.lastName = lastName;
    if (jobTitle !== undefined) profileUpdate.jobTitle = jobTitle;
    if (org !== undefined) profileUpdate.organization = org;
    if (location !== undefined) profileUpdate.location = location;
    if (skills !== undefined) profileUpdate.skills = skills;
    if (uxSettings !== undefined) profileUpdate.uxSettings = uxSettings;
    if (connectedApps !== undefined) profileUpdate.connectedApps = connectedApps;

    if (Object.keys(userUpdate).length > 0) {
      await db.update(schema.users)
        .set(userUpdate)
        .where(eq(schema.users.id, payload.userId));
    }

    if (Object.keys(profileUpdate).length > 0) {
      await db.insert(schema.profiles)
        .values({ userId: payload.userId, ...profileUpdate })
        .onConflictDoUpdate({
          target: schema.profiles.userId,
          set: profileUpdate,
        });
    }

    console.info('Profile updated', { userId: payload.userId });

    return new Response(JSON.stringify({ 
      success: true, 
      user: { 
        name, 
        firstName,
        lastName,
        jobTitle, 
        organization: org, 
        location, 
        skills,
        uxSettings: body.uxSettings,
        connectedApps: body.connectedApps
      } 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Update profile error:', { error: error.message, stack: error.stack, userId: payload.userId });
    return new Response(JSON.stringify({
      error: 'server_error',
      message: 'Server error updating profile',
      detail: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestDelete({ request, env }) {
  const payload = await verifyJWT(request, env);
  if (!payload) {
    return new Response(JSON.stringify({ 
      error: 'unauthorized',
      message: 'Unauthorized' 
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Rate limit by IP after auth
  const clientIp = getClientIp(request);
  const deleteRetryAfter = await applyRateLimit(env.AUTH_KV, 'me-delete', `ip:${clientIp}`);
  if (deleteRetryAfter) return rateLimitedResponse(deleteRetryAfter);

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ 
      error: 'invalid_body',
      message: 'Invalid request body' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { timing } = body;
  if (timing !== 'now' && timing !== 'end_of_cycle') {
    return new Response(JSON.stringify({ 
      error: 'invalid_timing',
      message: 'Invalid timing option' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const db = drizzle(env.MOSHLY_DB);

  try {
    if (timing === 'now') {
      // Immediate deletion - Cascade handles the rest
      await db.delete(schema.users)
        .where(eq(schema.users.id, payload.userId))
        .run();

      console.info('Account terminated NOW', { userId: payload.userId });

      return new Response(JSON.stringify({ success: true, message: 'Account terminated immediately' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Terminate at end of cycle
      // We set expiresAt to the end of the current billing period. 
      // For now, if we don't have a real billing engine, we might just set it to 30 days from now
      // or use the existing expiresAt if it exists.
      const existingSub = await db.select()
        .from(schema.subscriptions)
        .innerJoin(schema.workspaces, eq(schema.workspaces.id, schema.subscriptions.workspaceId))
        .where(eq(schema.workspaces.ownerId, payload.userId))
        .get();

      if (!existingSub) {
        return new Response(JSON.stringify({
          error: 'no_subscription',
          message: 'No active subscription found for this account.'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const endOfCycle = existingSub.subscriptions.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await db.update(schema.subscriptions)
        .set({ expiresAt: endOfCycle })
        .where(eq(schema.subscriptions.workspaceId, existingSub.subscriptions.workspaceId))
        .run();

      console.info('Account scheduled for termination', { userId: payload.userId, expiresAt: endOfCycle });

      return new Response(JSON.stringify({ success: true, message: 'Account scheduled for termination', expiresAt: endOfCycle }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Delete account error:', { error: error.message, userId: payload.userId });
    return new Response(JSON.stringify({ 
      error: 'server_error',
      message: 'Server error during account termination' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const onRequestOptions = ({ request }) => corsOptionsResponse(request, 'GET, PATCH, DELETE, OPTIONS');
