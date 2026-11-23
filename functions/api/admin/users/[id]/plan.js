import { requireGod, json } from '../../_guard';
import { PLAN_LIMITS } from '../../../_plans';

const PLANS = ['free', 'solo', 'collective', 'business', 'major'];
const DURATIONS = [0, 1, 3, 6, 12]; // months; 0 = no end date

// PUT /api/admin/users/:id/plan  { plan, months }
// Gives a user a plan, for a number of months or with no end date. When a
// fixed-term plan ends, the account moves back to free on its next request
// (see settleSubscription). Usage counters are kept.
export async function onRequestPut({ request, env, params }) {
  const { admin, response } = await requireGod(request, env);
  if (response) return response;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json', message: 'Send JSON: { plan, months }.' }, 400);
  }

  const plan = String(body?.plan || '');
  const months = Number(body?.months ?? 0);
  if (!PLANS.includes(plan)) {
    return json({ error: 'invalid_plan', message: `Plan must be one of: ${PLANS.join(', ')}.` }, 400);
  }
  if (!DURATIONS.includes(months)) {
    return json({ error: 'invalid_duration', message: 'Months must be 0 (no end date), 1, 3, 6 or 12.' }, 400);
  }

  const workspace = await env.MOSHLY_DB
    .prepare(`SELECT w.id FROM workspaces w JOIN subscriptions s ON s.workspace_id = w.id WHERE w.owner_id = ?`)
    .bind(params.id)
    .first();
  if (!workspace) {
    return json({ error: 'no_subscription', message: 'This account has no workspace or subscription to change.' }, 409);
  }

  let endsAt = null;
  if (plan !== 'free' && months > 0) {
    endsAt = new Date();
    endsAt.setUTCMonth(endsAt.getUTCMonth() + months);
  }
  const limits = PLAN_LIMITS[plan];

  try {
    await env.MOSHLY_DB
      .prepare(`UPDATE subscriptions SET plan = ?, pdf_exports_limit = ?, ai_credits_limit = ?, expires_at = ? WHERE workspace_id = ?`)
      .bind(plan, limits.pdfExportsLimit, limits.aiCreditsLimit, endsAt ? Math.floor(endsAt.getTime() / 1000) : null, workspace.id)
      .run();

    console.info('[admin] plan changed', { userId: params.id, plan, months, by: admin.userId });
    return json({ success: true, plan, planEndsAt: endsAt ? endsAt.toISOString() : null });
  } catch (err) {
    console.error('[admin] plan change failed', { userId: params.id, error: err.message });
    return json({ error: 'server_error', message: 'Could not change the plan.' }, 500);
  }
}
