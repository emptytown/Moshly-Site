import { jwtVerify } from 'jose';

export async function verifyJWT(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET || 'dev_secret_moshly');
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (err) {
    console.error('JWT verification failed:', err);
    return null;
  }
}
