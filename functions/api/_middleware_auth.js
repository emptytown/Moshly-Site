import { jwtVerify } from 'jose';

export async function verifyJWT(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    if (!env.JWT_SECRET) {
      throw new Error('CRITICAL: JWT_SECRET environment variable is not configured');
    }
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
      issuer: 'moshly',
      audience: 'moshly-api',
    });
    return payload;
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return null;
  }
}
