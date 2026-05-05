import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '../../../db/schema';
import { getAllowedOrigin, corsOptionsResponse } from '../../_cors';

function unauthorizedResponse(request) {
  return new Response(JSON.stringify({ error: 'unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': getAllowedOrigin(request) },
  });
}

function jsonResponse(request, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': getAllowedOrigin(request) },
  });
}

export async function onRequestGet({ request, env }) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token || !env.MOSHLY_INTERNAL_SECRET || token !== env.MOSHLY_INTERNAL_SECRET) {
    return unauthorizedResponse(request);
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId || typeof userId !== 'string') {
    return jsonResponse(request, { error: 'invalid_user_id' }, 400);
  }

  const db = drizzle(env.MOSHLY_DB);

  try {
    const row = await db
      .select({ subscription: schema.subscriptions })
      .from(schema.workspaces)
      .leftJoin(schema.subscriptions, eq(schema.subscriptions.workspaceId, schema.workspaces.id))
      .where(eq(schema.workspaces.ownerId, userId))
      .get();

    if (!row || !row.subscription) {
      return jsonResponse(request, { error: 'no_subscription' }, 404);
    }

    const { subscription } = row;
    const creditsRemaining = subscription.aiCreditsLimit - subscription.aiCreditsUsed;

    console.info('[ai-credits] Balance fetched', { userId, creditsUsed: subscription.aiCreditsUsed, creditsLimit: subscription.aiCreditsLimit });

    return jsonResponse(request, {
      creditsUsed: subscription.aiCreditsUsed,
      creditsLimit: subscription.aiCreditsLimit,
      creditsRemaining,
    });
  } catch (error) {
    console.error('[ai-credits] Balance error:', { error: error.message, userId });
    return jsonResponse(request, { error: 'server_error' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return corsOptionsResponse(request, 'GET, OPTIONS');
}
