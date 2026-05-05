import { verifyJWT } from '../../_middleware_auth';
import { getAllowedOrigin, corsOptionsResponse } from '../../_cors';

export async function onRequestPost({ request, env }) {
  // 1. Verify Authentication
  const payload = await verifyJWT(request, env);
  if (!payload) {
    return new Response(JSON.stringify({ 
      error: 'unauthorized',
      message: 'Unauthorized' 
    }), {
      status: 401,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': getAllowedOrigin(request)
      }
    });
  }

  try {
    // 2. Generate SSO Token (Short-lived, one-time use)
    const ssoToken = crypto.randomUUID();
    const SSO_TTL = 60; // 60 seconds as per plan

    // 3. Store in KV (Hub side Registry)
    // We store the user's essential context for verification later
    const ssoData = {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      plan: payload.plan,
      generatedAt: Date.now()
    };

    if (env.AUTH_KV) {
      await env.AUTH_KV.put(`sso:${ssoToken}`, JSON.stringify(ssoData), { expirationTtl: SSO_TTL });
    } else {
      console.error('CRITICAL: AUTH_KV is not configured');
      throw new Error('KV storage not available');
    }

    // 4. Return the token
    return new Response(JSON.stringify({
      success: true,
      token: ssoToken,
      expiresIn: SSO_TTL
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': getAllowedOrigin(request)
      }
    });

  } catch (error) {
    console.error('SSO Token generation error:', error.message);
    return new Response(JSON.stringify({ 
      error: 'server_error',
      message: 'Failed to generate SSO token' 
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
