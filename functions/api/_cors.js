const ALLOWED_ORIGINS = ['https://moshly.io', 'http://localhost:8788'];

export function getAllowedOrigin(request) {
  const origin = request?.headers?.get('Origin') || '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : 'https://moshly.io';
}
