#!/bin/bash
# Send a branded test email to the verified recipient

API_KEY=$(grep RESEND_API_KEY /Users/megacromo/DEV/Moshly/Moshly-Site/.dev.vars | cut -d'=' -f2)
RECIPIENT="emptytown@proton.me"
ORIGIN="http://localhost:8788"

JSON_BODY=$(cat <<EOF
{
  "from": "onboarding@resend.dev",
  "to": ["$RECIPIENT"],
  "subject": "Reset your Moshly password (Branded Test)",
  "html": "<div style=\"margin:0;padding:32px 16px;background-color:#0E0F14;font-family:sans-serif;\"><div style=\"max-width:600px;margin:0 auto;background:#1B1E2E;border:1px solid #2D3048;border-radius:16px;overflow:hidden;box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);\"><div style=\"padding:32px;text-align:center;border-bottom:1px solid #2D3048;background:#141624;\"><img src=\"$ORIGIN/assets/Moshly-Main-Logo-1.svg\" alt=\"Moshly\" style=\"height:32px;\" /></div><div style=\"padding:40px 32px;\"><h2 style=\"margin:0 0 16px;font-size:24px;font-weight:700;color:#E6E7EB;text-align:center;\">Password Reset Request</h2><p style=\"margin:0 0 24px;font-size:16px;color:#A4A7B5;text-align:center;\">This is a test of the professional Moshly email template. Click the link below to verify the flow:</p><div style=\"text-align:center;margin:32px 0;\"><a href=\"$ORIGIN/reset-password.html?token=TEST-TOKEN-UUID\" style=\"display:inline-block;background-color:#6B5CFF;color:#FFFFFF;padding:14px 28px;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;box-shadow: 0 4px 12px rgba(107, 92, 255, 0.3);\">Reset Password</a></div><p style=\"margin:24px 0 0;font-size:14px;color:#7B7F93;text-align:center;\">This link will expire in 1 hour.<br/>If you didn't request this, you can safely ignore this email.</p></div><div style=\"padding:24px 32px;border-top:1px solid #2D3048;background:#141624;text-align:center;\"><p style=\"margin:0;font-size:12px;color:#7B7F93;\">© 2026 Moshly · <a href=\"https://moshly.io\" style=\"color:#6B5CFF;text-decoration:none;\">moshly.io</a></p></div></div></div>"
}
EOF
)

curl -s -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "$JSON_BODY"
