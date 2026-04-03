const ALLOWED_ORIGINS = ['https://moshly.io', 'http://localhost:8788'];

export function getAllowedOrigin(request) {
  const origin = request?.headers?.get('Origin') || '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : 'https://moshly.io';
}

export function corsOptionsResponse(request, methods = 'POST, OPTIONS') {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': getAllowedOrigin(request),
      'Access-Control-Allow-Methods': methods,
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
