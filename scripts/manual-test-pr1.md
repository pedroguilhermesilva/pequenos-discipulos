# Roteiro de testes manuais — PR #1 (fundação auth + cache + votos)

## Pré-requisitos

```bash
cp .env.example .env
# Preencher DATABASE_URL, DIRECT_URL, AUTH_SECRET
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

**Login seed:** `dev@pequenos-discipulos.local` / `devpassword123`

Opcional (rate limit em prod): `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` no `.env.local`.

---

## 1. Autenticação

| Passo | Acção | Resultado esperado |
|-------|--------|-------------------|
| 1.1 | Abrir `/login` | Formulário de login |
| 1.2 | Login com credenciais seed | Redireciona para área autenticada |
| 1.3 | Clicar **Sair** na sidebar (desktop ou mobile) | Redireciona para `/login`; cookie NextAuth removido |
| 1.4 | Após sair, abrir `/home` directamente | Redireciona para login (sessão encerrada) |

---

## 2. Seleção de passagem (índice bíblico)

| Passo | Acção | Resultado esperado |
|-------|--------|-------------------|
| 2.1 | Ir a criar história / selecionar passagem | Lista de livros (AT/NT) |
| 2.2 | Escolher **Mateus**, cap. **2**, versos **1–3** | Validação OK; referência "Mateus 2:1–3" |
| 2.3 | Tentar intervalo inválido (ex. verso 999) | Mensagem de erro de validação |

---

## 3. Geração e cache por score

| Passo | Acção | Resultado esperado |
|-------|--------|-------------------|
| 3.1 | Gerar história para Mateus 2:1–3 (idade 3–5) | História exibida (stub LLM se sem `LLM_API_KEY`) |
| 3.2 | Clicar **Gerar novamente** (até 3×) | Versões cache de outros users, priorizando maior score |
| 3.3 | Após 3 caches, **Gerar novamente** | Nova geração LLM (4.ª versão) |

---

## 4. Visualizador — referência bíblica (sem texto integral)

| Passo | Acção | Resultado esperado |
|-------|--------|-------------------|
| 4.1 | Abrir passagem não-curada (ex. Mateus 1:20) | Diálogo mostra referência; **sem** texto completo dos versículos |
| 4.2 | Abrir passagem curada (ex. Mateus 2:1–3) | Preview curto das passagens sugeridas continua visível |

---

## 5. Parent gate + votos

| Passo | Acção | Resultado esperado |
|-------|--------|-------------------|
| 5.1 | Tentar votar sem parent gate | Modal parental; voto bloqueado |
| 5.2 | Completar parent gate e votar (👍) | Voto registado; score actualizado |
| 5.3 | Votar novamente na mesma adaptação | Idempotente (upsert, um voto por user) |

---

## 6. IDOR — aprovar / partilhar

| Passo | Acção | Resultado esperado |
|-------|--------|-------------------|
| 6.1 | **Aprovar em família** numa história **própria** | Sucesso (status `family_approved`) |
| 6.2 | **Partilhar** história própria | Sucesso (status `community`) |
| 6.3 | (DevTools) POST `/api/votes` com `action: family_approve` num `adaptationId` de **outro** user | **403** — "Esta adaptação não pertence à sua família." |

---

## 7. Rate limit (opcional)

| Passo | Acção | Resultado esperado |
|-------|--------|-------------------|
| 7.1 | >20 tentativas de login falhadas do mesmo IP em 15 min | Resposta **429** (mensagem genérica) |
| 7.2 | Com Upstash configurado em staging | Limite partilhado entre instâncias |

---

## 8. Regressão rápida

```bash
npm test
npm run build
npx tsc --noEmit
npm run lint
```

Todos devem passar antes de merge.
