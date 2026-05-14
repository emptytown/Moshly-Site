import { jwtVerify, importSPKI } from 'jose';

export async function verifyJWT(request, env) {
  const authHeader = request.headers.get('Authorization');

  if (!env.JWT_PUBLIC_KEY) {
    throw new Error('CRITICAL: JWT_PUBLIC_KEY environment variable is not configured');
  }

  let token = null;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else {
    const cookieHeader = request.headers.get('Cookie') || '';
    const match = cookieHeader.match(/(?:^|;\s*)moshly_at=([^;]+)/);
    token = match?.[1] ?? null;
  }

  if (!token) return null;

  const publicKey = await importSPKI(env.JWT_PUBLIC_KEY, 'RS256');
  try {
    const { payload } = await jwtVerify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: 'https://moshly.io',
      audience: 'moshly-api',
    });
    return payload;
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return null;
  }
}
