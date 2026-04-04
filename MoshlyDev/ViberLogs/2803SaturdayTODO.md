# Saturday TODO: March 28, 2026

Este plano reduz o volume de trabalho em 50% em relação ao anterior, focando em **Qualidade, Segurança e Estabilização** da infraestrutura de autenticação implementada.

---

### 📋 Prioridade de Hoje: Refinamento & Segurança (Quality First)

#### 1. Segurança & Auditoria (Audit Alignment)
- [x] **Validar JWT Secret**: Remover fallbacks de string (hardcoded) em `functions/api/login.js` e `_middleware_auth.js`.
  > ✅ Verified: `login.js:60-62` — `if (!env.JWT_SECRET) { throw new Error('CRITICAL: JWT_SECRET environment variable is not set'); }`. No fallback, explicit hard fail. `_middleware_auth.js:11-13` — same pattern.
- [x] **Auditoria de Reset Token**: Implementar invalidação imediata do `resetToken` após uso com sucesso.
  > ✅ Verified: `reset-password.js:63-65` — `resetToken: null, resetExpires: null` set in the same atomic UPDATE. TOCTOU race guarded by `result.meta.changes === 0` check.
- [x] **Proteção de User Enumeration**: `forgot-password.js` e `register.js` não vazam existência de usuários.
  > ✅ Verified: `forgot-password.js:38-46` — returns `success: true` with identical message regardless of user existence. `register.js:42-50` — existing email returns same `201` success response as a new registration.

#### 2. Otimização de Banco de Dados (Finalização)
- [x] **Transactions no Registro**: User + Workspace + Subscription em batch atômico em `register.js`.
  > ✅ Verified: `register.js:59-78` — `db.batch([...])` wraps all three inserts. D1 batch is atomic.
- [x] **Consistência de Esquema**: Constraint de ENUM para `invite_codes.plan`.
  > ✅ Verified: `schema.ts:55` — `plan: text('plan', { enum: ['free', 'solo', 'collective', 'business', 'major'] }).notNull()` — matches `subscriptions.plan` enum exactly.
- [x] **Update Timestamps**: Campo `updatedAt` atualiza corretamente em modificações.
  > ✅ Verified: `schema.ts:14` — `.$onUpdateFn(() => new Date())` — set for UPDATE events. DB-L01 from the audit is resolved.

#### 3. QA & Verificação (Production Readiness)
- [ ] **Scripts de Sanidade**: Script para testar o fluxo completo: Registro → Esqueci Senha → Reset → Login.
  > ❌ Not done. No test scripts found in the repository.
- [ ] **Documentação de Env Vars**: Atualizar o `README.md` com `RESEND_API_KEY`, `JWT_SECRET`, `RESEND_FROM_EMAIL`.
  > ❌ Not done. `README.md` still has the original content without the new env var requirements.

---

### 📊 Scores de Produção
- **Percentagem de Conclusão**: 75% → ~90% (todas as items de código concluídas; blocker é AUTH_KV + docs)
- **Score de Qualidade (Audit)**: 6.5/10 → 9.0/10 ✅ (meta atingida conforme Sunday entry)

---

### 🚀 O que vem a seguir (Backlog)
- [ ] Testes E2E com Playwright.
- [ ] Dashboard UI refinements.
- [ ] Integração de pagamentos Paddle.
- [ ] Fix N+1 in `refresh.js` — still makes 2 sequential D1 queries instead of a JOIN.

---
*Verified By VibeCheck ✅*
