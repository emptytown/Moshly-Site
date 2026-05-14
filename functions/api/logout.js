import { getAllowedOrigin, corsOptionsResponse } from './_cors';

export async function onRequestPost({ request, env }) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)moshly_rt=([^;]+)/);
  const refreshToken = match?.[1];

  if (refreshToken && env.AUTH_KV) {
    // Delete only this token — other sessions on other devices remain active.
    // All sessions are invalidated globally via rv:{userId} on password reset.
    await env.AUTH_KV.delete(`rt:${refreshToken}`);
  }

  const isSecure = new URL(request.url).protocol === 'https:';
  const cookieFlags = `HttpOnly${isSecure ? '; Secure' : ''}; SameSite=Strict; Path=/api; Max-Age=0`;
  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append('Set-Cookie', `moshly_at=; ${cookieFlags}`);
  headers.append('Set-Cookie', `moshly_rt=; ${cookieFlags}`);

  return new Response(JSON.stringify({ success: true, message: 'Logged out successfully' }), {
    status: 200,
    headers,
  });
}

export const onRequestOptions = ({ request }) => corsOptionsResponse(request, 'POST, OPTIONS');
