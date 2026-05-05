import { getAllowedOrigin, corsOptionsResponse } from '../../_cors';

export async function onRequestPost({ request, env }) {
  try {
    const { token } = await request.json();
    if (!token) {
      return new Response(JSON.stringify({ 
        error: 'missing_token',
        message: 'SSO token is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': getAllowedOrigin(request) }
      });
    }

    if (!env.AUTH_KV) {
      console.error('CRITICAL: AUTH_KV is not configured');
      return new Response(JSON.stringify({ 
        error: 'server_error',
        message: 'Internal server error' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': getAllowedOrigin(request) }
      });
    }

    // 1. Fetch token data from KV
    const kvKey = `sso:${token}`;
    const storedData = await env.AUTH_KV.get(kvKey);

    if (!storedData) {
      return new Response(JSON.stringify({ 
        error: 'invalid_token',
        message: 'Invalid or expired SSO token' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': getAllowedOrigin(request) }
      });
    }

    // 2. Parse and return the user context
    const ssoData = JSON.parse(storedData);

    // 3. One-time use: Delete the token immediately after verification
    await env.AUTH_KV.delete(kvKey);

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: ssoData.userId,
        email: ssoData.email,
        name: ssoData.name,
        role: ssoData.role,
        plan: ssoData.plan
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': getAllowedOrigin(request)
      }
    });

  } catch (error) {
    console.error('SSO verification error:', error.message);
    return new Response(JSON.stringify({ 
      error: 'server_error',
      message: 'Failed to verify SSO token' 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': getAllowedOrigin(request)
      }
    });
  }
}

export async function onRequestOptions({ request }) {
  return corsOptionsResponse(request, 'POST, OPTIONS');
}
