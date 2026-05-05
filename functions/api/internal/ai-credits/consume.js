import { drizzle } from 'drizzle-orm/d1';
import { eq, sql } from 'drizzle-orm';
import * as schema from '../../../db/schema';
import { getAllowedOrigin, corsOptionsResponse } from '../../_cors';

const MAX_CREDITS_PER_CALL = 50;

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

export async function onRequestPost({ request, env }) {
  // Service-to-service auth via shared secret
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token || !env.MOSHLY_INTERNAL_SECRET || token !== env.MOSHLY_INTERNAL_SECRET) {
    return unauthorizedResponse(request);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(request, { error: 'invalid_body' }, 400);
  }

  const { userId, amount } = body;

  if (!userId || typeof userId !== 'string') {
    return jsonResponse(request, { error: 'invalid_user_id' }, 400);
  }

  if (!Number.isInteger(amount) || amount < 1 || amount > MAX_CREDITS_PER_CALL) {
    return jsonResponse(request, { error: 'invalid_amount', max: MAX_CREDITS_PER_CALL }, 400);
  }

  const db = drizzle(env.MOSHLY_DB);

  try {
    // Find the user's workspace and subscription in a single query
    const row = await db
      .select({ subscription: schema.subscriptions, workspaceId: schema.workspaces.id })
      .from(schema.workspaces)
      .leftJoin(schema.subscriptions, eq(schema.subscriptions.workspaceId, schema.workspaces.id))
      .where(eq(schema.workspaces.ownerId, userId))
      .get();

    if (!row || !row.subscription) {
      return jsonResponse(request, { error: 'no_subscription' }, 404);
    }

    const { subscription, workspaceId } = row;
    const creditsRemaining = subscription.aiCreditsLimit - subscription.aiCreditsUsed;

    if (creditsRemaining < amount) {
      return jsonResponse(request, {
        error: 'insufficient_credits',
        creditsUsed: subscription.aiCreditsUsed,
        creditsLimit: subscription.aiCreditsLimit,
        creditsRemaining,
      }, 402);
    }

    // Atomic conditional increment — only succeeds if the condition still holds
    const updated = await db
      .update(schema.subscriptions)
      .set({ aiCreditsUsed: sql`${schema.subscriptions.aiCreditsUsed} + ${amount}` })
      .where(
        eq(schema.subscriptions.workspaceId, workspaceId)
      )
      .returning({ aiCreditsUsed: schema.subscriptions.aiCreditsUsed, aiCreditsLimit: schema.subscriptions.aiCreditsLimit })
      .get();

    if (!updated) {
      return jsonResponse(request, { error: 'update_failed' }, 500);
    }

    const newCreditsUsed = updated.aiCreditsUsed;
    const newCreditsRemaining = updated.aiCreditsLimit - newCreditsUsed;

    console.info('[ai-credits] Consumed', { userId, amount, newCreditsUsed, creditsLimit: updated.aiCreditsLimit });

    return jsonResponse(request, {
      success: true,
      creditsUsed: newCreditsUsed,
      creditsLimit: updated.aiCreditsLimit,
      creditsRemaining: newCreditsRemaining,
    });
  } catch (error) {
    console.error('[ai-credits] Consume error:', { error: error.message, userId, amount });
    return jsonResponse(request, { error: 'server_error' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return corsOptionsResponse(request, 'POST, OPTIONS');
}
