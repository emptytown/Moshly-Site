import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '../../../db/schema';
import { corsOptionsResponse } from '../../_cors';
import { authenticateApp, unauthorizedResponse, jsonResponse } from '../_app-auth';

const RESOURCES = {
  ai_credits: { usedKey: 'aiCreditsUsed',   limitKey: 'aiCreditsLimit'   },
  pdf_exports: { usedKey: 'pdfExportsUsed',  limitKey: 'pdfExportsLimit'  },
};

export async function onRequestGet({ request, env }) {
  const appId = await authenticateApp(request, env);
  if (!appId) return unauthorizedResponse();

  const url      = new URL(request.url);
  const userId   = url.searchParams.get('userId');
  const resource = url.searchParams.get('resource');

  if (!userId || typeof userId !== 'string') {
    return jsonResponse({ error: 'invalid_user_id' }, 400);
  }

  const config = RESOURCES[resource];
  if (!config) {
    return jsonResponse({ error: 'unknown_resource', knownResources: Object.keys(RESOURCES) }, 400);
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
      return jsonResponse({ error: 'no_subscription' }, 404);
    }

    const used      = row.subscription[config.usedKey];
    const limit     = row.subscription[config.limitKey];
    const remaining = limit - used;

    return jsonResponse({ used, limit, remaining, resource, app: appId });
  } catch (error) {
    console.error('[quota] balance error', { appId, userId, resource, error: error.message });
    return jsonResponse({ error: 'server_error' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return corsOptionsResponse(request, 'GET, OPTIONS');
}
