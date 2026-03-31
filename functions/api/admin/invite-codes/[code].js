import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '../../../db/schema';
import { verifyJWT } from '../../_middleware_auth';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// DELETE /api/admin/invite-codes/:code — revoke a code
export async function onRequestDelete({ request, env, params }) {
  const payload = await verifyJWT(request, env);
  if (!payload || payload.role !== 'god') {
    return json({ error: 'Forbidden' }, 403);
  }

  const code = (params.code || '').toUpperCase().trim();
  if (!code) {
    return json({ error: 'Code is required' }, 400);
  }

  const db = drizzle(env.MOSHLY_DB);

  try {
    const existing = await db
      .select({ code: schema.inviteCodes.code })
      .from(schema.inviteCodes)
      .where(eq(schema.inviteCodes.code, code))
      .get();

    if (!existing) {
      return json({ error: 'Code not found' }, 404);
    }

    await db.delete(schema.inviteCodes).where(eq(schema.inviteCodes.code, code));

    console.info('Invite code revoked', { code, revokedBy: payload.userId });

    return json({ success: true, message: `Code ${code} revoked.` });
  } catch (err) {
    console.error('Failed to revoke invite code:', { error: err.message, code });
    return json({ error: 'Failed to revoke code' }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
