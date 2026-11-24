// Minimal Stripe REST client for Cloudflare Pages Functions (fetch + Web Crypto),
// so no SDK dependency is needed.

import { STRIPE_API_VERSION } from './_config';

const STRIPE_API = 'https://api.stripe.com/v1';
const SIGNATURE_TOLERANCE_SECONDS = 300;

export class StripeError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'StripeError';
    this.status = status;
    this.code = code;
  }
}

/** Flattens { a: { b: [1] } } into Stripe's form encoding: a[b][0]=1 */
export function encodeForm(params, prefix = '', out = new URLSearchParams()) {
  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null) continue;
    const name = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (item !== null && typeof item === 'object') encodeForm(item, `${name}[${i}]`, out);
        else out.append(`${name}[${i}]`, String(item));
      });
    } else if (typeof value === 'object') {
      encodeForm(value, name, out);
    } else {
      out.append(name, String(value));
    }
  }
  return out;
}

export async function stripeRequest(env, method, path, params, { idempotencyKey } = {}) {
  if (!env.STRIPE_SECRET_KEY) throw new StripeError('Stripe is not configured', 503, 'not_configured');

  const headers = {
    Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
    'Stripe-Version': STRIPE_API_VERSION,
  };
  let url = `${STRIPE_API}${path}`;
  let body;
  if (params && method === 'GET') {
    url += `?${encodeForm(params)}`;
  } else if (params) {
    body = encodeForm(params).toString();
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
  }
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

  const res = await fetch(url, { method, headers, body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new StripeError(data?.error?.message || `Stripe error ${res.status}`, res.status, data?.error?.code);
  }
  return data;
}

async function hmacSha256Hex(secret, payload) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Verifies a Stripe-Signature header (t=...,v1=...) against the raw request body.
 * Returns true only for a valid v1 signature inside the time tolerance.
 */
export async function verifyStripeSignature(rawBody, header, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!header || !secret) return false;
  let timestamp = null;
  const signatures = [];
  for (const part of header.split(',')) {
    const [k, v] = part.split('=', 2).map((s) => s?.trim());
    if (k === 't') timestamp = Number(v);
    else if (k === 'v1' && v) signatures.push(v);
  }
  if (!Number.isFinite(timestamp) || signatures.length === 0) return false;
  if (Math.abs(nowSeconds - timestamp) > SIGNATURE_TOLERANCE_SECONDS) return false;

  const expected = await hmacSha256Hex(secret, `${timestamp}.${rawBody}`);
  return signatures.some((sig) => timingSafeEqual(sig, expected));
}

/** Billing period end (seconds) — on the items in API 2025-03-31+, on the subscription before. */
export function subscriptionPeriodEnd(subscription) {
  const itemEnds = (subscription?.items?.data || [])
    .map((item) => item.current_period_end)
    .filter((v) => Number.isFinite(v));
  if (itemEnds.length) return Math.min(...itemEnds);
  return subscription?.current_period_end ?? null;
}

/** Subscription ID on an invoice — moved under parent.subscription_details in 2025-03-31. */
export function invoiceSubscriptionId(invoice) {
  const fromParent = invoice?.parent?.subscription_details?.subscription;
  const legacy = invoice?.subscription;
  const id = fromParent || legacy;
  return typeof id === 'string' ? id : id?.id || null;
}
