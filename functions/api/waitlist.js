import { getAllowedOrigin } from './_cors';

const RESEND_API_BASE = 'https://api.resend.com';

function json(data, status = 200, origin = 'https://moshly.io') {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

async function resendRequest(path, apiKey, payload) {
  const response = await fetch(`${RESEND_API_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));
  return { response, result };
}

async function addToAudience(apiKey, audienceId, email, source) {
  if (!audienceId) return;

  const { response, result } = await resendRequest(
    `/audiences/${audienceId}/contacts`,
    apiKey,
    {
      email,
      unsubscribed: false,
      audienceId,
      properties: { source },
    },
  );

  if (response.ok || response.status === 409) {
    return;
  }

  throw new Error(result.message || result.error || 'Unable to add contact to Resend audience');
}

async function sendEmail(apiKey, payload) {
  const { response, result } = await resendRequest('/emails', apiKey, payload);

  if (!response.ok) {
    throw new Error(result.message || result.error || 'Unable to send email');
  }
}

function buildSubscriberEmailHtml() {
  return `
    <div style="margin:0;padding:32px 16px;background-color:#f3f5fb;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e7ebf4;border-radius:20px;overflow:hidden;">
        <div style="padding:20px 28px;background:linear-gradient(135deg,#0e0f14 0%,#15192a 100%);">
          <div style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#98a2c7;">Moshly</div>
          <div style="margin-top:10px;font-family:Arial,sans-serif;font-size:28px;line-height:1.15;font-weight:700;color:#ffffff;">
            You're on the waitlist
          </div>
        </div>
        <div style="padding:32px 28px 18px 28px;font-family:Arial,sans-serif;color:#1f2937;">
          <p style="margin:0 0 16px 0;font-size:17px;line-height:1.65;">
            Thanks for joining us early. Your place on the Moshly waitlist is confirmed.
          </p>
          <p style="margin:0 0 24px 0;font-size:17px;line-height:1.65;color:#4b5563;">
            We're building a sharper home for artists, managers, and the people behind the scenes who keep music moving.
          </p>
          <div style="margin:0 0 24px 0;padding:20px;border-radius:16px;background:#f6f8fc;border:1px solid #e7ebf4;">
            <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;margin-bottom:12px;">What to expect</div>
            <div style="font-size:16px;line-height:1.7;color:#111827;">
              We'll keep you posted with launch news, early access updates, and the first invitation when Moshly goes live.
            </div>
          </div>
          <p style="margin:0 0 24px 0;font-size:15px;line-height:1.7;color:#6b7280;">
            No noise. Just the updates that matter, a clearer picture of what we're building, and, from time to time, maybe a few early perks along the way.
          </p>
          <a href="https://moshly.io" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#6b5cff;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;">
            Visit Moshly
          </a>
        </div>
        <div style="padding:18px 28px 28px 28px;font-family:Arial,sans-serif;font-size:13px;line-height:1.7;color:#6b7280;">
          Questions? Reply to <a href="mailto:hello@moshly.io" style="color:#6b5cff;text-decoration:none;">hello@moshly.io</a>.
          <br />
          © 2026 Moshly. All rights reserved.
        </div>
      </div>
    </div>
  `;
}

function buildSubscriberEmailText() {
  return [
    "You're on the Moshly waitlist.",
    '',
    'Thanks for joining us early. Your place on the Moshly waitlist is confirmed.',
    '',
    "We'll keep you posted with launch news, early access updates, and the first invitation when Moshly goes live.",
    '',
    "No noise. Just the updates that matter, a clearer picture of what we're building, and, from time to time, maybe a few early perks along the way.",
    '',
    'Visit Moshly: https://moshly.io',
    'Questions: hello@moshly.io',
  ].join('\n');
}

export async function onRequestOptions({ request }) {
  return json({}, 204, getAllowedOrigin(request));
}

export async function onRequestPost({ request, env }) {
  const origin = getAllowedOrigin(request);
  try {
    const { email, source = 'launching-soon' } = await request.json();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return json({ error: 'Please enter a valid email address.' }, 400, origin);
    }

    const apiKey = env.WAITLIST_API_KEY;
    const fromEmail = env.RESEND_FROM_EMAIL;
    const notifyTo = env.WAITLIST_NOTIFY_TO;
    const audienceId = env.RESEND_AUDIENCE_ID;

    if (!apiKey || !fromEmail || !notifyTo) {
      return json({ error: 'Waitlist email service is not configured yet.' }, 500, origin);
    }

    await addToAudience(apiKey, audienceId, normalizedEmail, source);

    await sendEmail(apiKey, {
      from: fromEmail,
      to: [normalizedEmail],
      subject: "You're on the Moshly waitlist",
      html: buildSubscriberEmailHtml(),
      text: buildSubscriberEmailText(),
    });

    await sendEmail(apiKey, {
      from: fromEmail,
      to: [notifyTo],
      subject: `New Moshly waitlist signup: ${normalizedEmail}`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111827;">
          <p>A new waitlist signup was received.</p>
          <p><strong>Email:</strong> ${normalizedEmail}</p>
          <p><strong>Source:</strong> ${source}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        </div>
      `,
      text: `New waitlist signup\nEmail: ${normalizedEmail}\nSource: ${source}\nTime: ${new Date().toISOString()}`,
    });

    return json({ success: true }, 200, origin);
  } catch (error) {
    console.error('Waitlist signup error:', error);
    return json({ error: 'Could not add you to the waitlist right now.' }, 500, origin);
  }
}
