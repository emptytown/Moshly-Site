import { getAllowedOrigin, corsOptionsResponse } from './_cors';

export async function onRequestPost({ request, env }) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)moshly_rt=([^;]+)/);
  const refreshToken = match?.[1];

  if (refreshToken && env.AUTH_KV) {
    // Read stored value to find userId before deleting — needed to clean up reverse index (F-12)
    const stored = await env.AUTH_KV.get(`rt:${refreshToken}`);
    const keysToDelete = [`rt:${refreshToken}`];
    if (stored) {
      try {
        const { userId } = JSON.parse(stored);
        if (userId) keysToDelete.push(`rt:user:${userId}`);
      } catch {
        // Stored value malformed — still delete the primary key
      }
    }
    await Promise.all(keysToDelete.map(k => env.AUTH_KV.delete(k)));
  }

  const isSecure = new URL(request.url).protocol === 'https:';
  const clearCookie = `moshly_rt=; HttpOnly${isSecure ? '; Secure' : ''}; SameSite=Strict; Path=/api; Max-Age=0`;

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': clearCookie,
    },
  });
}

export const onRequestOptions = ({ request }) => corsOptionsResponse(request, 'POST, OPTIONS');
