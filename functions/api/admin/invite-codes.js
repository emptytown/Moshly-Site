import { drizzle } from 'drizzle-orm/d1';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../../db/schema';
import { verifyJWT } from '../_middleware_auth';
import { getAllowedOrigin } from '../_cors';

const ALLOWED_PLANS = ['free', 'solo', 'collective', 'business', 'major', 'semi_god', 'god'];
const ALLOWED_DURATIONS = [0, 3, 6, 12]; // months; 0 = eternal
const CODE_PREFIX = 'MOSH-';
const CODE_SUFFIX_LENGTH = 6;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function requireGod(payload) {
  return payload?.role === 'god';
}

function generateCode(custom) {
  if (custom) return custom.toUpperCase().trim();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const randomBytes = crypto.getRandomValues(new Uint8Array(CODE_SUFFIX_LENGTH));
  const suffix = Array.from(randomBytes, b => chars[b % chars.length]).join('');
  return `${CODE_PREFIX}${suffix}`;
}

function computeSubscriptionExpiresAt(durationMonths) {
  if (durationMonths === 0) return null; // eternal
  const date = new Date();
  date.setMonth(date.getMonth() + durationMonths);
  return date;
}

// GET /api/admin/invite-codes — list all codes
export async function onRequestGet({ request, env }) {
  const payload = await verifyJWT(request, env);
  if (!payload || !requireGod(payload)) {
    return json({ error: 'Forbidden' }, 403);
  }

  const db = drizzle(env.MOSHLY_DB);

  try {
    const codes = await db
      .select()
      .from(schema.inviteCodes)
      .orderBy(desc(schema.inviteCodes.createdAt))
      .all();

    return json({
      success: true,
      codes: codes.map(c => ({
        code: c.code,
        plan: c.plan,
        months: c.durationMonths,
        max_uses: c.maxUses,
        uses_count: c.usesCount,
        expires_at: c.expiresAt ? c.expiresAt.toISOString() : null,
        note: c.note,
        created_at: c.createdAt ? c.createdAt.toISOString() : null,
      })),
    });
  } catch (err) {
    console.error('Failed to list invite codes:', { error: err.message });
    return json({ error: 'Failed to load invite codes' }, 500);
  }
}

// POST /api/admin/invite-codes — create a code
export async function onRequestPost({ request, env }) {
  const payload = await verifyJWT(request, env);
  if (!payload || !requireGod(payload)) {
    return json({ error: 'Forbidden' }, 403);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { plan, months, max_uses, note, code: customCode } = body;

  if (!ALLOWED_PLANS.includes(plan)) {
    return json({ error: `Invalid plan. Must be one of: ${ALLOWED_PLANS.join(', ')}` }, 400);
  }
  if (!ALLOWED_DURATIONS.includes(Number(months))) {
    return json({ error: 'Invalid duration. Allowed: 0 (eternal), 3, 6, 12 months' }, 400);
  }
  const durationMonths = Number(months);
  const maxUses = Math.max(1, Math.min(9999, parseInt(max_uses) || 1));

  const db = drizzle(env.MOSHLY_DB);

  // Look up God's workspace to satisfy the NOT NULL workspaceId FK
  const godWorkspace = await db
    .select({ id: schema.workspaces.id })
    .from(schema.workspaces)
    .where(eq(schema.workspaces.ownerId, payload.userId))
    .get();

  if (!godWorkspace) {
    return json({ error: 'God user workspace not found' }, 500);
  }

  const code = generateCode(customCode);

  // Code itself expires in 1 year unless it's eternal (0 months = no code expiry either)
  const codeExpiresAt = durationMonths === 0
    ? null
    : computeSubscriptionExpiresAt(12); // code valid for 1 year to be redeemed

  try {
    await db.insert(schema.inviteCodes).values({
      code,
      workspaceId: godWorkspace.id,
      plan,
      durationMonths,
      maxUses,
      usesCount: 0,
      expiresAt: codeExpiresAt,
      note: note || null,
    });

    console.info('Invite code created', { code, plan, durationMonths, maxUses, createdBy: payload.userId });

    return json({
      success: true,
      code: {
        code,
        plan,
        months: durationMonths,
        max_uses: maxUses,
        uses_count: 0,
        expires_at: codeExpiresAt ? codeExpiresAt.toISOString() : null,
        note: note || null,
      },
    }, 201);
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return json({ error: 'Code already exists. Try a different custom code or leave it blank.' }, 409);
    }
    console.error('Failed to create invite code:', { error: err.message, code });
    return json({ error: 'Failed to create invite code' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': getAllowedOrigin(request),
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
