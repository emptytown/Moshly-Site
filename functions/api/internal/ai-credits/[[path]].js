// The old quota addresses, replaced by /api/internal/quota/* (commit bf4944d).
// They answer 410 in JSON so an app still calling them fails loudly instead of
// receiving the home page with a 200.
const MOVED = {
  balance: 'GET /api/internal/quota/balance?userId=<id>&resource=ai_credits',
  consume: 'POST /api/internal/quota/consume { userId, resource: "ai_credits", amount }',
};

export async function onRequest({ params }) {
  const name = Array.isArray(params.path) ? params.path.join('/') : '';
  return new Response(JSON.stringify({
    error: 'endpoint_moved',
    message: 'The ai-credits endpoints were replaced by /api/internal/quota/*.',
    use: MOVED[name] ?? MOVED,
  }), {
    status: 410,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
