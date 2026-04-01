# Thursday TODO: April 3, 2026

Continuação da sessão de Terça. Auth core estável, contact form live, todas as páginas de auth são dedicadas. Foco de hoje: **DB performance, CORS hardening, QA e backlog de produto**.

---

### 📊 Status de Entrada

- **Score de Qualidade (Audit)**: 9.0/10
- **Percentagem de Conclusão**: ~88%
- **Auth KV**: ✅ Provisionado (`id = "67a5f773bd124eafb0ae5af32aadb02e"`)
- **Blockers ativos**: CORS ainda `*`, refresh.js N+1, sem testes E2E

---

### 🗄️ Database — Open Items (from db-audit.md)

- [ ] **DB-N01 — Fix N+1 in `refresh.js`** (`functions/api/refresh.js:41-66`)
  Makes 2 sequential D1 queries instead of a single JOIN. Mirror the fix applied to `login.js` and `me.js` on Friday.
  > Also add the missing `profile` join — `/api/refresh` token payload is less complete than `/api/login`.

- [ ] **DB-L02 — Move D1 ID to env var** (`drizzle.config.ts`)
  Hardcoded `078bb103-ae9b-4975-9e21-66877f480333` should come from an env var to prevent config drift across environments.

- [ ] **DB-M05 — Define `skills` format** (`schema.ts:23`)
  Low urgency — defer until skill-filtering feature is scoped. Note for when dashboard/profile work begins.

---

### 🔐 Security

- [ ] **Restrict CORS** (`functions/api/login.js:116`)
  `Access-Control-Allow-Origin: '*'` — replace with `https://moshly.io` (and `http://localhost:8788` for dev, gated by `env.ENVIRONMENT`).
  > Carried over from Sunday — still open.

- [ ] **Verify Cloudflare Secrets are set in dashboard**
  - `JWT_SECRET` — as Secret
  - `RESEND_API_KEY` — as Secret
  - `RESEND_FROM_EMAIL=noreply@moshly.io` — as Variable
  - `CONTACT_NOTIFY_TO=hello@moshly.io` — as Variable
  > Cannot verify from code — requires Cloudflare dashboard check.

---

### 🧪 QA & Testing

- [ ] **Sanity test full auth flow** (curl or Insomnia):
  1. `POST /api/register` → new user + welcome email
  2. `POST /api/login` → access token (15min) + refresh token (7d)
  3. `GET /api/me` → validate payload completeness
  4. `POST /api/refresh` → rotated tokens
  5. `POST /api/forgot-password` → reset email sent
  6. `POST /api/reset-password` → password updated, token consumed
  7. `POST /api/contact` → user confirmation + team notification emails

- [ ] **Verify `setup-profile.html` post-register flow**
  Confirm redirect from `/signup.html` → `/setup-profile.html` works end-to-end with real AUTH_KV deployed.

---

### 🎨 Frontend / UX

- [ ] **`contact.html` — verify form live in production**
  Contact form was added today. Confirm `/api/contact` responds correctly on the deployed URL.

- [ ] **`admin.html` — test invite code flow end-to-end**
  God user creates code → user redeems via `/join.html` → subscription set correctly.

---

### 🚀 Backlog (próximas sessões)

- [ ] Integração de pagamentos **Paddle** — billing + subscription management
- [ ] Dashboard UI refinements
- [ ] Testes E2E com Playwright — fluxo completo de auth
- [ ] Rate limit dashboard / alertas para picos anômalos
- [ ] Spoke architecture — `postMessage` / subdomain session sharing for mini-apps

---

### 📊 Scores Esperados ao Final de Quinta

- **Score de Qualidade (Audit)**: 9.0/10 → 9.5/10 (após CORS + refresh.js fix)
- **Percentagem de Conclusão**: 88% → 93%

---

*Verified By VibeCheck ✅*
