import { drizzle } from 'drizzle-orm/d1';
import { eq, sql } from 'drizzle-orm';
import * as schema from '../../../db/schema';
import { corsOptionsResponse } from '../../_cors';

function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: 'unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost({ request, env }) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token || !env.MOSHLY_INTERNAL_SECRET || token !== env.MOSHLY_INTERNAL_SECRET) {
    return unauthorizedResponse();
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid_body' }, 400);
  }

  const { userId } = body;

  if (!userId || typeof userId !== 'string') {
    return jsonResponse({ error: 'invalid_user_id' }, 400);
  }

  const db = drizzle(env.MOSHLY_DB);

  try {
    const row = await db
      .select({ subscription: schema.subscriptions, workspaceId: schema.workspaces.id })
      .from(schema.workspaces)
      .leftJoin(schema.subscriptions, eq(schema.subscriptions.workspaceId, schema.workspaces.id))
      .where(eq(schema.workspaces.ownerId, userId))
      .get();

    if (!row || !row.subscription) {
      return jsonResponse({ error: 'no_subscription' }, 404);
    }

    const updated = await db
      .update(schema.subscriptions)
      .set({ pdfExportsUsed: sql`${schema.subscriptions.pdfExportsUsed} + 1` })
      .where(eq(schema.subscriptions.workspaceId, row.workspaceId))
      .returning({ pdfExportsUsed: schema.subscriptions.pdfExportsUsed, pdfExportsLimit: schema.subscriptions.pdfExportsLimit })
      .get();

    if (!updated) {
      return jsonResponse({ error: 'update_failed' }, 500);
    }

    console.info('[pdf-exports] Consumed', { userId, pdfExportsUsed: updated.pdfExportsUsed, pdfExportsLimit: updated.pdfExportsLimit });

    return jsonResponse({
      success: true,
      pdfExportsUsed: updated.pdfExportsUsed,
      pdfExportsLimit: updated.pdfExportsLimit,
    });
  } catch (error) {
    console.error('[pdf-exports] Consume error:', { error: error.message, userId });
    return jsonResponse({ error: 'server_error' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return corsOptionsResponse(request, 'POST, OPTIONS');
}
