# Sunday TODO: March 29, 2026

Continuação do plano de Sábado. Auth core atingiu **9.0/10**. Foco de hoje: QA, Frontend Integration e Preparação de Backlog.

---

### 📊 Status de Entrada
- **Score de Qualidade (Audit)**: 9.0/10 ✅ (meta atingida)
- **Percentagem de Conclusão**: ~80%
- **Blocker ativo**: KV namespace `AUTH_KV` ainda precisa ser criado no Cloudflare

---

### ⚠️ Pré-requisito Imediato (fazer primeiro)

```bash
# Criar o namespace KV no Cloudflare
wrangler kv:namespace create AUTH_KV
# Copiar os IDs gerados para wrangler.toml (id + preview_id)
```

> ✅ **DONE (2026-03-30)** — Namespaces provisioned via `wrangler kv namespace create AUTH_KV`. `wrangler.toml` updated with real IDs: `id = "67a5f773bd124eafb0ae5af32aadb02e"`, `preview_id = "4c934828e2824b459e2aca262eed3a5f"`.

---

### 🔐 Segurança — Loose Ends

- [x] **Integrar refresh token no frontend**: `auth-client.js` deve chamar `/api/refresh` automaticamente quando o access token (30min) expirar.
  > ✅ **DONE (2026-03-30)** — Two fixes applied:
  > 1. Login handler now persists `data.refreshToken` to `localStorage` as `moshly_refresh_token`.
  > 2. `authFetch` intercepts `401` responses: calls `silentRefresh()` (new method), retries the original request once with the new token, then forces `logout()` if refresh fails.
  > `logout()` also clears `moshly_refresh_token`.
- [ ] **CORS restrito**: `login.js` responde `Access-Control-Allow-Origin: *` — restringir ao domínio de produção após deploy.
  > ❌ **NOT DONE** — `login.js:116` still has `'Access-Control-Allow-Origin': '*'`.

---

### 🧪 QA & Verificação (do Sábado pendente)

- [ ] **Scripts de Sanidade**: Testar o fluxo completo via curl ou Insomnia:
  1. `POST /api/register` → novo usuário
  2. `POST /api/login` → recebe `token` (30min) + `refreshToken`
  3. `GET /api/me` → valida token
  4. `POST /api/refresh` → rota new access + refresh tokens
  5. `POST /api/forgot-password` → gera link de reset
  6. `POST /api/reset-password` → troca senha, consome token
  > ❌ **NOT DONE** — no test scripts found.
- [x] **Documentação de Env Vars**: Atualizar `README.md` com lista obrigatória:
  - `JWT_SECRET` — chave de assinatura JWT (mínimo 32 chars aleatórios)
  - `RESEND_API_KEY` — chave da API Resend para emails transacionais
  - `RESEND_FROM_EMAIL` — remetente (ex: `Moshly <hello@moshly.io>`)
  - `AUTH_KV` — binding KV (criado via `wrangler kv:namespace create AUTH_KV`)
  - `MOSHLY_DB` — binding D1 (já configurado no `wrangler.toml`)
  > ✅ **DONE (2026-04-01)** — `README.md` fully rewritten: Cloudflare Pages stack, all env vars, dev instructions (`wrangler pages dev`), project structure, auth flow, deploy steps.

---

### 🎨 Frontend Integration

- [x] **`auth-client.js`**: Implementar silent refresh — interceptar respostas 401 e tentar `POST /api/refresh` antes de fazer logout forçado.
  > ✅ **DONE (2026-03-30)** — `silentRefresh()` added; `authFetch` retries once on 401 before logout.
- [ ] **`setup-profile.html`**: Verificar se o flow pós-registro ainda funciona com os novos tokens de 30min.
  > ⚠️ Not verified — requires manual QA with AUTH_KV deployed.

---

### 🐛 Additional Issues Found (not in original plan)

- [ ] **`refresh.js` N+1 queries** (`refresh.js:41-66`): Makes 2 sequential D1 queries (user → workspace → subscription) instead of a single JOIN. Inconsistent with the N+1 fixes applied to `login.js` and `me.js`.
- [ ] **`refresh.js` missing profile join**: `/api/me` returns `profile` data but `/api/refresh` does not fetch it — token payload on refresh is less complete than on initial login.

---

### 🚀 Backlog (próximas sessões)

- [ ] Testes E2E com Playwright — fluxo completo de auth.
- [ ] Dashboard UI refinements.
- [ ] Integração de pagamentos Paddle.
- [ ] Rate limit dashboard / alertas para picos anômalos.

---

### 📊 Scores Esperados ao Final de Domingo
- **Score de Qualidade**: 9.0/10 → manter
- **Percentagem de Conclusão**: 80% → 85% (após QA + env docs)

---

*Verified By VibeCheck ✅*
