import { eq } from 'drizzle-orm';
import * as schema from '../../db/schema';
import { getAllowedOrigin } from '../_cors';

export function json(request, body, status = 200) {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  if (request) {
    headers['Access-Control-Allow-Origin'] = getAllowedOrigin(request);
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  return new Response(JSON.stringify(body), { status, headers });
}

/** The signed-in user's own workspace and its subscription row. */
export async function loadOwnerWorkspace(db, userId) {
  return db.select({
    user: { id: schema.users.id, email: schema.users.email, name: schema.users.name },
    workspace: { id: schema.workspaces.id, name: schema.workspaces.name },
    subscription: schema.subscriptions,
  })
    .from(schema.users)
    .innerJoin(schema.workspaces, eq(schema.workspaces.ownerId, schema.users.id))
    .leftJoin(schema.subscriptions, eq(schema.subscriptions.workspaceId, schema.workspaces.id))
    .where(eq(schema.users.id, userId))
    .get();
}

/** Base URL for Stripe redirects: the host that served this request (production or preview). */
export function siteOrigin(request) {
  return new URL(request.url).origin;
}
