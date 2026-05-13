import { jwtVerify, importSPKI } from 'jose';

export async function verifyJWT(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    if (!env.JWT_PUBLIC_KEY) {
      throw new Error('CRITICAL: JWT_PUBLIC_KEY environment variable is not configured');
    }
    const publicKey = await importSPKI(env.JWT_PUBLIC_KEY, 'RS256');
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
