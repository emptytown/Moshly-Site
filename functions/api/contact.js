import { applyRateLimit, getClientIp, rateLimitedResponse } from './_rate-limit';
import { getAllowedOrigin } from './_cors';

const RESEND_API = 'https://api.resend.com/emails';
const MAX_MESSAGE_LENGTH = 2000;
const MAX_NAME_LENGTH = 100;

const ALLOWED_SUBJECTS = [
  'Plan question',
  'Custom deal',
  'Technical support',
  'Partnership',
  'Other',
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function sendViaResend(apiKey, payload) {
  const response = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || result.error || `Resend error ${response.status}`);
  }

  return result;
}

function buildUserConfirmationHtml(name, subject, message, origin) {
  const logoUrl = `${origin}/assets/Moshly-Main-Logo-1.svg`;
  return `
    <div style="margin:0;padding:32px 16px;background-color:#0E0F14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#1B1E2E;border:1px solid #2D3048;border-radius:16px;overflow:hidden;box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);">
        <div style="padding:32px;text-align:center;border-bottom:1px solid #2D3048;background:#141624;">
          <img src="${logoUrl}" alt="Moshly" style="height:32px;margin-bottom:12px;" />
        </div>
        <div style="padding:40px 32px;">
          <div style="font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#7B7F93;margin-bottom:12px;text-align:center;">Contact Request</div>
          <h2 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#E6E7EB;line-height:1.3;text-align:center;">We got your message.</h2>
          <p style="margin:0 0 24px;font-size:16px;color:#A4A7B5;line-height:1.7;text-align:center;">
            Hi ${esc(name)}, thanks for reaching out. We've received your message and will get back to you shortly.
          </p>
          <div style="background:#141624;border:1px solid #24273A;border-radius:12px;padding:24px;margin:32px 0;">
            <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#7B7F93;margin-bottom:10px;">Your message</div>
            <div style="font-size:15px;color:#A4A7B5;font-weight:600;margin-bottom:8px;">${esc(subject)}</div>
            <div style="font-size:14px;color:#E6E7EB;line-height:1.6;white-space:pre-wrap;">${esc(message)}</div>
          </div>
          <p style="margin:0;font-size:14px;color:#7B7F93;line-height:1.7;text-align:center;">
            We reply fast — usually within a business day.<br/>
            In the meantime, feel free to explore <a href="${origin}/pricing.html" style="color:#6B5CFF;text-decoration:none;">our plans</a>.
          </p>
        </div>
        <div style="padding:24px 32px;border-top:1px solid #2D3048;background:#141624;text-align:center;">
          <p style="margin:0;font-size:12px;color:#7B7F93;letter-spacing:0.02em;">
            © 2026 Moshly · <a href="${origin}" style="color:#6B5CFF;text-decoration:none;">moshly.io</a>
          </p>
        </div>
      </div>
    </div>
  `;
}

function buildTeamNotificationHtml(name, email, subject, message) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;padding:24px;">
      <h2 style="margin:0 0 16px;">New contact form submission</h2>
      <table style="border-collapse:collapse;width:100%;">
        <tr><td style="padding:6px 0;font-weight:600;width:80px;">Name</td><td>${esc(name)}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;">Email</td><td>${esc(email)}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;">Subject</td><td>${esc(subject)}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;vertical-align:top;">Message</td><td style="white-space:pre-wrap;">${esc(message)}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;">Time</td><td>${new Date().toISOString()}</td></tr>
      </table>
    </div>
  `;
}

export async function onRequestPost({ request, env }) {
  // Rate limit: 5 submissions per 15 min per IP
  const clientIp = getClientIp(request);
  const retryAfter = await applyRateLimit(env.AUTH_KV, 'forgot-password', `contact:${clientIp}`);
  if (retryAfter) return rateLimitedResponse(retryAfter);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  const name    = String(body.name    || '').trim().slice(0, MAX_NAME_LENGTH);
  const email   = String(body.email   || '').trim().toLowerCase();
  const subject = String(body.subject || '').trim();
  const message = String(body.message || '').trim().slice(0, MAX_MESSAGE_LENGTH);

  if (!name)                          return json({ error: 'Name is required' }, 400);
  if (!isValidEmail(email))           return json({ error: 'A valid email is required' }, 400);
  if (!ALLOWED_SUBJECTS.includes(subject)) return json({ error: 'Invalid subject' }, 400);
  if (!message || message.length < 10) return json({ error: 'Message must be at least 10 characters' }, 400);

  const apiKey    = env.RESEND_API_KEY;
  const fromEmail = env.RESEND_FROM_EMAIL || 'noreply@moshly.io';
  const notifyTo  = env.CONTACT_NOTIFY_TO || 'hello@moshly.io';
  const origin    = new URL(request.url).origin;

  if (!apiKey) {
    console.error('Contact form failed: RESEND_API_KEY not configured');
    return json({ error: 'Email service is not configured' }, 500);
  }

  try {
    // Send both emails in parallel
    await Promise.all([
      sendViaResend(apiKey, {
        from: `Moshly <${fromEmail}>`,
        to: [email],
        subject: 'We got your message — Moshly',
        html: buildUserConfirmationHtml(name, subject, message, origin),
        text: `Hi ${name},\n\nThanks for reaching out. We've received your message and will get back to you shortly.\n\nYour message:\n${subject}\n${message}\n\n© 2026 Moshly · moshly.io`,
      }),
      sendViaResend(apiKey, {
        from: `Moshly Contact <${fromEmail}>`,
        to: [notifyTo],
        reply_to: email,
        subject: `Contact: ${subject} — ${name}`,
        html: buildTeamNotificationHtml(name, email, subject, message),
        text: `New contact\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage: ${message}\nTime: ${new Date().toISOString()}`,
      }),
    ]);

    console.info('Contact form submitted', { name, email: '[redacted]', subject });

    return json({ success: true });
  } catch (err) {
    console.error('Contact form email failed:', { error: err.message });
    return json({ error: 'Failed to send message. Please try again.' }, 500);
  }
}

export async function onRequestOptions({ request }) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': getAllowedOrigin(request),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
