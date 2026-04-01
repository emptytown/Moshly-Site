// Rate limiting via Cloudflare KV (AUTH_KV binding).
// Fixed window per identifier. Gracefully degrades if KV is not bound.
//
// Key format : rl:{endpoint}:{identifier}
// Identifiers: "ip:{CF-Connecting-IP}"  and/or  "email:{normalised-email}"

const WINDOW_SECONDS = 900; // 15-minute window

const MAX_ATTEMPTS_PER_WINDOW = {
  login: 10,
  register: 5,
  'forgot-password': 5,
  'reset-password': 5,
};

/**
 * Returns the client IP from Cloudflare-injected headers.
 */
export function getClientIp(request) {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0].trim() ||
    'unknown'
  );
}

/**
 * Increments the counter for (endpoint, identifier) and returns a retryAfter
 * value (seconds) if the limit is now exceeded, or null if the request is allowed.
 *
 * One call both records the attempt AND enforces the limit — intentional so that
 * every attempt counts regardless of outcome (prevents probing via timing).
 */
export async function applyRateLimit(kv, endpoint, identifier) {
  if (!kv) return null; // graceful degradation — KV not bound in dev

  const maxAttempts = MAX_ATTEMPTS_PER_WINDOW[endpoint] ?? 10;
  const now = Math.floor(Date.now() / 1000);
  const key = `rl:${endpoint}:${identifier}`;

  const raw = await kv.get(key);
  const state = raw
    ? JSON.parse(raw)
    : { count: 0, windowStart: now };

  // Reset counter if current window has expired
  if (now - state.windowStart >= WINDOW_SECONDS) {
    state.count = 0;
    state.windowStart = now;
  }

  state.count += 1;
  await kv.put(key, JSON.stringify(state), {
    expirationTtl: WINDOW_SECONDS + 60,
  });

  if (state.count > maxAttempts) {
    const retryAfter = state.windowStart + WINDOW_SECONDS - now;
    return retryAfter > 0 ? retryAfter : 1;
  }

  return null;
}

/**
 * Builds the standard 429 response with a Retry-After header.
 */
export function rateLimitedResponse(retryAfter) {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    }
  );
}
