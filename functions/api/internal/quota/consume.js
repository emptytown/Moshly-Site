import { drizzle } from 'drizzle-orm/d1';
import { eq, sql, and } from 'drizzle-orm';
import * as schema from '../../../db/schema';
import { corsOptionsResponse } from '../../_cors';
import { authenticateApp, unauthorizedResponse, jsonResponse } from '../_app-auth';

// Resource registry — add new quota types here, no new files needed
const RESOURCES = {
  ai_credits: {
    usedKey:      'aiCreditsUsed',
    limitKey:     'aiCreditsLimit',
    usedCol:      schema.subscriptions.aiCreditsUsed,
    limitCol:     schema.subscriptions.aiCreditsLimit,
    enforceLimit: true,   // blocks consume when over limit
    maxPerCall:   50,
  },
  pdf_exports: {
    usedKey:      'pdfExportsUsed',
    limitKey:     'pdfExportsLimit',
    usedCol:      schema.subscriptions.pdfExportsUsed,
    limitCol:     schema.subscriptions.pdfExportsLimit,
    enforceLimit: false,  // tracks only, never blocks
    maxPerCall:   1,
  },
};

export async function onRequestPost({ request, env }) {
  const appId = await authenticateApp(request, env);
  if (!appId) return unauthorizedResponse();

  let body;
  try { body = await request.json(); }
  catch { return jsonResponse({ error: 'invalid_body' }, 400); }

  const { userId, resource, amount = 1 } = body;

  if (!userId || typeof userId !== 'string') {
    return jsonResponse({ error: 'invalid_user_id' }, 400);
  }

  const config = RESOURCES[resource];
  if (!config) {
    return jsonResponse({ error: 'unknown_resource', knownResources: Object.keys(RESOURCES) }, 400);
  }

  if (!Number.isInteger(amount) || amount < 1 || amount > config.maxPerCall) {
    return jsonResponse({ error: 'invalid_amount', max: config.maxPerCall }, 400);
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

    const sub = row.subscription;
    const currentUsed  = sub[config.usedKey];
    const currentLimit = sub[config.limitKey];
    const remaining    = currentLimit - currentUsed;

    if (config.enforceLimit && remaining < amount) {
      return jsonResponse({
        error: 'insufficient_credits',
        used: currentUsed,
        limit: currentLimit,
        remaining,
      }, 402);
    }

    // Atomic increment — conditional on limit when enforced
    const whereConditions = [eq(schema.subscriptions.workspaceId, row.workspaceId)];
    if (config.enforceLimit) {
      whereConditions.push(
        sql`${config.usedCol} + ${amount} <= ${config.limitCol}`
      );
    }

    const setFields = { [config.usedKey]: sql`${config.usedCol} + ${amount}` };

    const updated = await db
      .update(schema.subscriptions)
      .set(setFields)
      .where(and(...whereConditions))
      .returning({ used: config.usedCol, limit: config.limitCol })
      .get();

    if (!updated && config.enforceLimit) {
      return jsonResponse({
        error: 'insufficient_credits',
        used: currentUsed,
        limit: currentLimit,
        remaining,
      }, 402);
    }

    const newUsed      = updated?.used  ?? currentUsed + amount;
    const newLimit     = updated?.limit ?? currentLimit;
    const newRemaining = newLimit - newUsed;

    console.info('[quota] consumed', { appId, userId, resource, amount, newUsed, newLimit });

    return jsonResponse({ success: true, used: newUsed, limit: newLimit, remaining: newRemaining });
  } catch (error) {
    console.error('[quota] consume error', { appId, userId, resource, amount, error: error.message });
    return jsonResponse({ error: 'server_error' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return corsOptionsResponse(request, 'POST, OPTIONS');
}
