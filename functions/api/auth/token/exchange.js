import { SignJWT, importPKCS8 } from 'jose';
import { verifyJWT } from '../../_middleware_auth';
import { applyRateLimit, getClientIp, rateLimitedResponse } from '../../_rate-limit';
import { corsOptionsResponse } from '../../_cors';

const ALLOWED_AUDIENCES = new Set([
  'moshly-run',
  'moshly-rank',
  'moshly-jam',
  'moshly-merchpad',
]);

const SCOPED_TOKEN_TTL = '5m';

export async function onRequestPost({ request, env }) {
  const clientIp = getClientIp(request);
  const ipRetryAfter = await applyRateLimit(env.AUTH_KV, 'token-exchange', `ip:${clientIp}`);
  if (ipRetryAfter) return rateLimitedResponse(ipRetryAfter);

  const payload = await verifyJWT(request, env);
  if (!payload) {
    return new Response(JSON.stringify({
      error: 'unauthorized',
      message: 'Unauthorized',
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let audience;
  try {
    ({ audience } = await request.json());
  } catch {
    return new Response(JSON.stringify({
      error: 'invalid_body',
      message: 'Invalid request body',
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!audience || !ALLOWED_AUDIENCES.has(audience)) {
    return new Response(JSON.stringify({
      error: 'invalid_audience',
      message: 'Unknown or disallowed audience',
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!env.JWT_PRIVATE_KEY) {
    throw new Error('CRITICAL: JWT_PRIVATE_KEY environment variable is not set');
  }

  const privateKey = await importPKCS8(env.JWT_PRIVATE_KEY, 'RS256');
  const scopedToken = await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    plan: payload.plan,
  })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setIssuer('https://moshly.io')
    .setAudience(audience)
    .setExpirationTime(SCOPED_TOKEN_TTL)
    .sign(privateKey);

  return new Response(JSON.stringify({
    token: scopedToken,
    expiresIn: 300,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const onRequestOptions = ({ request }) => corsOptionsResponse(request, 'POST, OPTIONS');
