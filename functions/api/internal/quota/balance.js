// GET /api/internal/quota/balance?userId=<id>[&resource=ai_credits|pdf_exports]
// With `resource`: { resource, used, limit, remaining, resetsAt, app } (as before).
// Without it:      { plan, resetsAt, quotas: { ai_credits: {...}, pdf_exports: {...} }, app }
import { corsOptionsResponse } from '../../_cors';
import { authenticateApp, unauthorizedResponse, jsonResponse } from '../_app-auth';
import {
  QUOTA_RESOURCES, isQuotaResource, loadSubscriptionForUser, quotaSnapshot, allQuotaSnapshots, quotaDb,
} from '../../_quota';
import { nextUsagePeriodStart } from '../../_subscription';

export async function onRequestGet({ request, env }) {
  const caller = await authenticateApp(request, env);
  if (!caller) return unauthorizedResponse();

  const url      = new URL(request.url);
  const userId   = url.searchParams.get('userId');
  const resource = url.searchParams.get('resource');

  if (!userId) return jsonResponse({ error: 'invalid_user_id' }, 400);
  if (resource && !isQuotaResource(resource)) {
    return jsonResponse({ error: 'unknown_resource', knownResources: Object.keys(QUOTA_RESOURCES) }, 400);
  }

  try {
    const sub = await loadSubscriptionForUser(quotaDb(env), userId);
    if (!sub) return jsonResponse({ error: 'no_subscription' }, 404);

    if (resource) return jsonResponse({ ...quotaSnapshot(sub, resource), app: caller.appId });
    return jsonResponse({
      plan: sub.plan,
      resetsAt: nextUsagePeriodStart().toISOString(),
      quotas: allQuotaSnapshots(sub),
      app: caller.appId,
    });
  } catch (error) {
    console.error('[quota] balance error', { app: caller.appId, userId, resource, error: error.message });
    return jsonResponse({ error: 'server_error' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return corsOptionsResponse(request, 'GET, OPTIONS');
}
