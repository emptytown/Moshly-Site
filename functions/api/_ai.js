// Moshly AI: the one place that talks to the AI provider.
//
// Every Moshly app (and the iOS app) asks moshly.io for AI instead of holding a
// provider key. For each call this module: checks the feature, spends the
// user's AI credits, calls the model (retrying when the provider is busy), and
// gives the credits back if the call fails. Only this site holds the key.
//
//   App server → POST /api/internal/ai/chat  (app secret)        → runAI()
//   iOS / web  → POST /api/ai/chat           (user access token) → runAI()
//
// Provider: any OpenAI-compatible chat-completions endpoint. Defaults to
// Google Gemini; switching provider or model is configuration only:
//   AI_API_KEY (secret)  AI_API_URL (optional)  AI_MODEL (optional)
import { consumeQuota, refundQuota } from './_quota';

const DEFAULT_API_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const DEFAULT_MODEL = 'gemini-2.5-flash';

/**
 * Feature registry: what each AI action costs in credits, and its answer size
 * limit. Name features `<app>.<action>`. A new AI feature in any app needs an
 * entry here (unknown features are refused), so prices live in one place.
 * `model` can override AI_MODEL for one feature.
 */
export const AI_FEATURES = {
  'quote.generate_intro':     { credits: 2,  maxTokens: 600 },
  'quote.chat':               { credits: 2,  maxTokens: 1200 },
  'rank.seo_scan':            { credits: 10, maxTokens: 8192 },
  'rank.keywords_suggest':    { credits: 5,  maxTokens: 8192 },
  'rank.serp_analyze':        { credits: 3,  maxTokens: 8192 },
  'rank.competitors_compare': { credits: 8,  maxTokens: 8192 },
  'rank.assistant_chat':      { credits: 2,  maxTokens: 4096 },
};

/** { feature: credits } — for apps to show "uses N credits" without hard-coding it. */
export function aiFeatureCosts() {
  return Object.fromEntries(Object.entries(AI_FEATURES).map(([name, f]) => [name, f.credits]));
}

const ROLES = new Set(['system', 'user', 'assistant']);
const MAX_MESSAGES = 60;
const MAX_INPUT_CHARS = 200_000;
const PROVIDER_TIMEOUT_MS = 90_000;
const RETRYABLE = new Set([429, 500, 503]);
const MAX_ATTEMPTS = 3;

function badRequest(error, extra = {}) {
  return { ok: false, status: 400, error, ...extra };
}

function validate({ feature, messages, responseFormat }) {
  if (!Object.prototype.hasOwnProperty.call(AI_FEATURES, feature)) {
    return badRequest('unknown_feature', { knownFeatures: Object.keys(AI_FEATURES) });
  }
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return badRequest('invalid_messages', { max: MAX_MESSAGES });
  }
  let chars = 0;
  for (const m of messages) {
    if (!m || !ROLES.has(m.role) || typeof m.content !== 'string') return badRequest('invalid_messages');
    chars += m.content.length;
  }
  if (chars > MAX_INPUT_CHARS) return badRequest('input_too_long', { maxChars: MAX_INPUT_CHARS });
  if (responseFormat !== undefined) {
    const type = responseFormat?.type;
    if (!['text', 'json_object', 'json_schema'].includes(type)) return badRequest('invalid_response_format');
  }
  return null;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callProvider(env, config, { messages, responseFormat, maxTokens }) {
  const payload = {
    model: config.model || env.AI_MODEL || DEFAULT_MODEL,
    messages: messages.map(({ role, content }) => ({ role, content })),
    max_tokens: Math.min(maxTokens || config.maxTokens, config.maxTokens),
  };
  if (responseFormat) payload.response_format = responseFormat;

  let lastError = 'no_attempt';
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let res;
    try {
      res = await fetch(env.AI_API_URL || DEFAULT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.AI_API_KEY}` },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      });
    } catch (err) {
      lastError = `network: ${err.message}`;
      if (attempt < MAX_ATTEMPTS) { await sleep(800 * attempt); continue; }
      break;
    }
    if (res.ok) {
      const data = await res.json().catch(() => null);
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || !content.trim()) return { ok: false, detail: 'empty answer' };
      return { ok: true, content, usage: data.usage ?? null, model: data.model ?? payload.model };
    }
    const body = (await res.text().catch(() => '')).slice(0, 300);
    lastError = `${res.status} ${body}`;
    if (!RETRYABLE.has(res.status) || attempt === MAX_ATTEMPTS) break;
    await sleep(800 * attempt);
  }
  return { ok: false, detail: lastError };
}

/**
 * Runs one AI call for a user. Returns
 *   { ok: true, content, usage, model, charged: { resource, amount }, quota }
 * or { ok: false, status, error, ...details } where error is one of:
 *   unknown_feature | invalid_messages | input_too_long | invalid_response_format (400)
 *   insufficient_credits (402, with quota) | no_subscription (404)
 *   ai_unavailable (503 — provider failed; credits were given back)
 */
export async function runAI(db, env, { userId, feature, messages, responseFormat, maxTokens, caller }) {
  const invalid = validate({ feature, messages, responseFormat });
  if (invalid) return invalid;

  if (!env.AI_API_KEY) {
    console.error('[ai] AI_API_KEY is not set');
    return { ok: false, status: 503, error: 'ai_unavailable' };
  }

  const config = AI_FEATURES[feature];
  const spent = await consumeQuota(db, userId, 'ai_credits', config.credits);
  if (!spent.ok) {
    const { ok, status, ...details } = spent;
    return { ok: false, status, ...details };
  }

  const started = Date.now();
  const answer = await callProvider(env, config, { messages, responseFormat, maxTokens });
  if (!answer.ok) {
    await refundQuota(db, userId, 'ai_credits', config.credits);
    console.error('[ai] provider failed, credits refunded', { caller, userId, feature, detail: answer.detail });
    return { ok: false, status: 503, error: 'ai_unavailable' };
  }

  const { ok, ...quota } = spent;
  console.info('[ai] ok', {
    caller, userId, feature, credits: config.credits, model: answer.model,
    tokens: answer.usage?.total_tokens, ms: Date.now() - started,
  });
  return {
    ok: true,
    content: answer.content,
    usage: answer.usage,
    model: answer.model,
    charged: { resource: 'ai_credits', amount: config.credits },
    quota,
  };
}
