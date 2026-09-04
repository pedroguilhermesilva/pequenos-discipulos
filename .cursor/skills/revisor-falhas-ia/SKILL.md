---
name: revisor-falhas-ia
description: >-
  Revisa o projeto (ou o diff) atrás das falhas mais comuns em apps geradas
  por IA: (1) tabelas sem RLS; (2) autorização decidida no frontend em vez do
  servidor; (3) rotas que buscam por ID sem checar o dono (IDOR); (4)
  segredos/API keys expostos no código ou no bundle; (5) input do usuário sem
  validação/sanitização e upload sem checar tipo de arquivo; (6) CSRF em
  server actions; (7) SSRF (as URLs são guardadas, o servidor não as fetcha);
  (8) enumeração de e-mails no login; (9) headers de segurança (CSP, etc.);
  (10) open redirect em callbackUrl/redirectTo; (11) rate limit no login e
  em writes públicos. Usar em revisões de código, PRs, auditorias de
  segurança, features novas com Prisma/rotas/actions/uploads/auth/login/
  next.config, e quando o utilizador mencionar RLS, IDOR, secrets, CSRF,
  SSRF, CSP, enumeração, open redirect, rate limit, autorização, validação
  ou estas falhas.
---

# Revisor das falhas comuns (app gerada por IA)

Revisor de **todo o projeto** (ou do âmbito pedido) atrás destas falhas:

1. tabelas sem RLS
2. autorização decidida no frontend em vez do servidor
3. rotas que buscam por ID sem checar o dono (IDOR)
4. segredos/API keys expostos no código ou no bundle
5. input do usuário sem validação/sanitização e upload sem checar tipo de arquivo
6. CSRF em server actions
7. SSRF (as URLs são guardadas, o servidor não as fetcha)
8. enumeração de e-mails no login
9. headers de segurança (CSP, etc.)
10. open redirect em callbackUrl/redirectTo
11. rate limit no login e em writes públicos

Não alargar a um security review genérico. Só estas 11, a menos que o utilizador peça mais.

Não corrigir código a menos que o utilizador peça explicitamente o fix a seguir.

## Quando aplicar

Aplicar automaticamente quando:

- o utilizador pede revisão, auditoria, PR review, code review, ou estas falhas
- há mudanças em `prisma/`, `src/use-cases/`, `app/**/actions.ts`, `app/api/`, uploads, env, auth, login, `next.config.ts`, `proxy.ts`, `vercel.json`
- o pedido envolve RLS, IDOR, secrets, API keys, autorização, validação, CSRF, SSRF, CSP, headers, enumeração de e-mails, open redirect, callbackUrl ou rate limit

Não aplicar em copy de UI, descrições Asana, ou refactors sem impacto em dados/auth/input/headers.

## Âmbito

1. Se o utilizador indicar ficheiros/PR/branch → esse âmbito.
2. Se for revisão de PR / “o que mudou” → diff vs base (`origin/dev` ou `main`).
3. Caso contrário (auditoria / “todo o projeto”) → repositório completo, priorizando:
   - `prisma/schema.prisma` e `prisma/migrations/`
   - `src/use-cases/` (lógica de negócio — **fonte de verdade**)
   - `app/**/actions.ts`, `app/api/**`, páginas com `params.id`
   - `src/lib/auth.ts`, `app/(auth)/login/`, `src/lib/rate-limit.ts`
   - `next.config.ts`, `proxy.ts`, `vercel.json`
   - `src/components/**` (falhas 2, 5, 7)
   - `.env*`, `src/lib/`, código cliente (`"use client"`)

## Relatório (obrigatório)

Português. Uma tabela, uma linha por finding, ordenada por gravidade:

| # | Falha | Gravidade | Local (ficheiro:linha) | Evidência | Risco |
|---|-------|-----------|------------------------|-----------|-------|

Gravidade: **Crítica** > **Alta** > **Média**. Sem findings numa falha → uma linha “nenhum finding” nessa falha (não omitir as 11).

Depois da tabela: 3–6 frases com os piores riscos e o que verificar a seguir. Sem patches.

---

## 1. Tabelas sem RLS

Neste repo a BD é **PostgreSQL (Neon) via Prisma**. Não há Supabase client. Isolamento actual = `tenantId` (ou FK para entidade do tenant) **nas queries da app**. Isso **não substitui RLS** no Postgres: um `findUnique({ where: { id } })` fura o isolamento.

**Passa**

- Modelo tenant-scoped tem `tenantId` **ou** FK obrigatória para pai com `tenantId` (ex.: `Booking` → `Restaurant`).
- Migrations com `ENABLE ROW LEVEL SECURITY` + `CREATE POLICY` alinhadas com `tenantId` / dono (quando existirem).
- Queries Prisma em dados de tenant incluem `tenantId: context.tenantId` (ou join equivalente) **e** `requireTenantContext()`.

**Falha**

- `model` novo/alterado tenant-scoped sem `tenantId` nem FK para dono.
- `prisma/migrations/` sem `ENABLE ROW LEVEL SECURITY` / `CREATE POLICY` para tabelas de tenant (reportar **uma vez** como finding sistémico Alta se o projecto inteiro não tiver RLS; não listar cada tabela).
- Query/raw SQL sem filtro de tenant em tabela de tenant.
- Tabela de tenant com RLS desligado, policy `USING (true)`, ou policy só no `SELECT` (writes abertos).

**Como procurar**

```bash
rg -n "ENABLE ROW LEVEL SECURITY|CREATE POLICY|ALTER TABLE" prisma/
rg -n "model " prisma/schema.prisma
rg -n "prisma\.\w+\.(findUnique|findFirst|findMany|update|delete|upsert)" src/ app/ --glob '*.ts'
```

Tabelas globais legítimas (não marcar): `User` (auth). Mesmo assim, mutações devem ir pelo use case autenticado.

---

## 2. Autorização decidida no frontend em vez do servidor

Esconder botões **não** é autorização. A decisão tem de estar no **servidor**: use case com `requireTenantContext` + `requirePermission` (+ `requireRestaurantAccess` quando o recurso é de um restaurante).

**Passa**

- Server Action / Route Handler chama use case; o use case chama `requirePermission(context, modulo, acao)` **antes** de ler/escrever.
- UI pode usar `hasPermission` só para UX (ocultar controlos).

**Falha**

- `hasPermission` / `canEdit` / `permissions.*.edit` só em componente cliente, e o `actions.ts` / `app/api` / use case **não** chama `requirePermission`.
- Action `"use server"` com Prisma direto, sem `requireTenantContext` / `requirePermission`.
- Página server que mostra/edita dados sem as mesmas guards do use case.
- Middleware/proxy que “protege” a rota mas a action continua invocável.

**Como procurar**

```bash
rg -n "hasPermission|canEdit|canDelete|permissions\." src/components app --glob '*.{ts,tsx}'
rg -n '"use server"' app --glob '*.ts'
rg -n "requirePermission|requireTenantContext|requireRestaurantAccess" src/use-cases app
```

Cruzar cada action em `app/**/actions.ts` e cada `app/api/**/route.ts` com o use case. Se a action não passa pelo use case, é finding.

---

## 3. Rotas que buscam por ID sem checar o dono (IDOR)

Qualquer leitura/escrita por `id` (params, query, FormData, JSON) tem de provar que o recurso pertence ao tenant (e restaurante, se houver scope).

**Passa**

```ts
where: { id, tenantId: context.tenantId }
```

ou equivalente via relação (`restaurant: { tenantId }`) + `requireRestaurantAccess(context, restaurantId)` quando o membro não tem `accessAllRestaurants`.

IDs públicos (slug da landing, token de unsubscribe) são OK se o segredo **não** for um cuid adivinhável de outro tenant — tokens HMAC/aleatórios, não `customerId` cru.

**Falha**

- `findUnique` / `update` / `delete` com `where: { id }` (ou só `id` do params) em modelo tenant-scoped.
- `app/**/[id]/**` ou `app/api/**/[id]/**` que carrega o recurso sem `tenantId`.
- FormData `id` / `campaignId` / `customerId` usado sem re-checar dono no servidor.
- SuperAdmin a operar noutro tenant sem `requireSuperAdmin` + tenant alvo explícito.

**Como procurar**

```bash
rg -n "where:\s*\{\s*id:" src/use-cases app --glob '*.ts'
rg -n "params\.(id|bookingId|customerId|campaignId|restaurantId)" app --glob '*.{ts,tsx}'
rg -n "formData.get\([\"']id[\"']\)" app --glob '*.ts'
```

Cada match: confirmar `tenantId` (ou dono) **na mesma query**. Se o id vem do cliente e o where não inclui dono → Crítica.

---

## 4. Segredos/API keys expostos no código ou no bundle

Segredo = qualquer valor que autentique ou dê acesso (DB, Resend, Blob, Redis, cron, VAPID **private**, `AUTH_SECRET`). `NEXT_PUBLIC_*` entra no bundle.

**Passa**

- Segredos só em env de servidor (`process.env.X` em código server: use cases, `src/lib/*` sem `"use client"`, route handlers).
- `.env*` no `.gitignore`; `.env.example` com placeholders vazios.
- Público permitido: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (chave pública).

**Falha**

- Literal `sk_`, `re_`, `postgres://`, `AUTH_SECRET=`, `BLOB_READ_WRITE_TOKEN`, `VAPID_PRIVATE_KEY`, `CRON_SECRET` em `src/`, `app/`, testes commitados com valores reais.
- `NEXT_PUBLIC_` em segredo (API keys, tokens de escrita, private keys).
- Segredo importado para ficheiro `"use client"` ou passado a componente cliente.
- Token de cron/webhook sem comparação em route `app/api`.
- Palavra-passe de demo no bundle (`defaultValue="demo1234"` no login, credenciais do seed em componentes cliente). `prisma/seed.ts` só em local/staging não é finding; o form de produção a pré-preencher `demo1234` é.

**Como procurar**

```bash
rg -n "NEXT_PUBLIC_" app src --glob '*.{ts,tsx,js}'
rg -n "(sk_live|sk_test|re_|AKIA|BEGIN PRIVATE|postgres://|ghp_|xoxb-)" app src --glob '!*.example'
rg -n "process\.env\.(AUTH_SECRET|DATABASE_URL|RESEND_API_KEY|BLOB_|CRON_SECRET|VAPID_PRIVATE|UNSUBSCRIBE_SECRET|UPSTASH_)" --glob '*.{ts,tsx}'
rg -n "demo1234|defaultValue=" src/components/auth app --glob '*.{ts,tsx}'
```

Confirmar que cada `process.env` de segredo **não** está em módulo cliente. `tests/` com secrets fake (`test-secret-...`) não é finding.

---

## 5. Input do usuário sem validação/sanitização e upload sem checar tipo de arquivo

Validação no cliente é UX. A fonte de verdade é **Zod no servidor** (`src/lib/validators/` ou schema no use case), aplicada ao input **antes** de persistir.

**Passa**

- Use case: `validateXInput(input)` / `schema.safeParse` e só depois Prisma.
- Strings de utilizador não interpoladas em SQL raw nem em HTML (`dangerouslySetInnerHTML` só com sanitização).
- Upload: tipo verificado **no servidor** (MIME allowlist + extensão + tamanho). `accept=` no `<input>` não conta. Não confiar só em `file.type`.

**Falha**

- `formData.get(...)` passado a Prisma/email/blob sem schema Zod.
- Query/`searchParams` usados em `where` sem whitelist/coerce.
- Upload (`uploadBlob`, `put(`, `type="file"`) sem allowlist de MIME/extensão no servidor, ou allowlist só no `accept` do input.
- CSV/XLSX import sem validar colunas/tipos no servidor (`validateImportCustomersInput` é o padrão).
- HTML de landing/templates renderido cru a partir de input.

**Como procurar**

```bash
rg -n "formData.get\(" app src --glob '*.{ts,tsx}'
rg -n "uploadBlob|put\(|type=[\"']file[\"']|accept=" app src --glob '*.{ts,tsx}'
rg -n "dangerouslySetInnerHTML|\$queryRaw|\$executeRaw" app src --glob '*.{ts,tsx}'
rg -n "validate\w+Input|safeParse" src/use-cases app --glob '*.ts'
```

Cada action/route com FormData ou JSON: tem de existir `validate*` **no servidor** (use case ou action). Validação só no form React → finding.

Uploads neste repo: `src/lib/blob.ts` + `BLOB_READ_WRITE_TOKEN`. Qualquer caller tem de restringir `contentType` (não aceitar o do cliente às cegas) e tamanho.

---

## 6. CSRF em server actions

Next.js App Router valida `Origin`/`Host` nas Server Actions. Isso **não** cobre Route Handlers (`app/api/**`) nem actions se `allowedOrigins` estiver aberto.

**Passa**

- Mutações via `"use server"` (POST) com cookies de sessão; sem `serverActions.allowedOrigins: ["*"]`.
- Route Handlers que mutam: método POST/PATCH/DELETE, auth no servidor, sem CORS `*` com credenciais.
- Cookies de sessão `SameSite=Lax` (ou `Strict`); não `None` sem necessidade.

**Falha**

- `experimental.serverActions.allowedOrigins` (ou equivalente) com `*` / origens de terceiros.
- `app/api/**` que muta em **GET** (ex.: cancelar reserva, unsubscribe que altera estado só com GET sem token HMAC).
- `Access-Control-Allow-Origin: *` (ou eco do `Origin`) em rotas autenticadas por cookie.
- Form HTML clássico `method="POST"` para API própria **sem** SameSite/origem, se não for Server Action.
- Action pública (login, unsubscribe) invocável cross-origin porque a origem check foi desligada.

Unsubscribe com token HMAC no POST é OK; GET que só mostra a página também. GET que **altera** consentimento → finding.

**Como procurar**

```bash
rg -n "allowedOrigins|serverActions" next.config.ts
rg -n "export async function GET" app/api --glob '*.ts'
rg -n "Access-Control-Allow-Origin|Access-Control-Allow-Credentials" app src proxy.ts next.config.ts
rg -n '"use server"' app --glob '*.ts'
```

---

## 7. SSRF (as URLs são guardadas, o servidor não as fetcha)

Neste produto, URLs de utilizador (`logoUrl`, `customSvgUrl`, `ctaUrl`, `imageUrl`, galeria, especialidades) são **persistidas e renderizadas** (`<img src>`, `<a href>`). O servidor **não** as fetcha. Guardar um URL **não é SSRF**.

**Passa**

- Validar formato (`z.string().url()`, http/https) e gravar.
- O browser do visitante é que pede o recurso.

**Falha (SSRF de verdade)**

- Servidor faz `fetch` / `axios` / `got` / `undici` / `head` a um URL que veio do cliente (logo, webhook, preview, og:image, proxy de imagem, “validar URL”).
- Pedido a `localhost`, `127.0.0.1`, `169.254.169.254`, IPs privados, ou seguir redirects para aí.
- `new URL(userInput)` usado como destino de pedido server-side.

Não reportar SSRF só porque existe `logoUrl` na BD ou `<img src={logoUrl}>`. `javascript:` / `data:` em href é XSS (falha 5), não SSRF.

**Como procurar**

```bash
rg -n "fetch\(|axios|got\(|undici" src app --glob '*.{ts,tsx}'
rg -n "logoUrl|ctaUrl|imageUrl|customSvgUrl" src/use-cases src/lib app --glob '*.ts'
```

Cada `fetch(`: o URL é constante/env (Resend, Blob, Redis, APIs internas) → OK. Se concatena ou usa campo de input/BD → Crítica.

---

## 8. Enumeração de e-mails no login

O login não pode revelar se um e-mail existe. Mesma mensagem, mesmo status HTTP, custo semelhante (não saltar o `bcrypt` quando o user não existe).

Padrão neste repo: `loginAction` / `authorize` devolvem `"Credenciais inválidas."` em qualquer falha.

**Passa**

- Uma única mensagem genérica (e-mail desconhecido **e** password errada).
- Sem `fieldErrors.email` do tipo “não encontrado” / “já existe” em rotas **públicas**.
- `authorize` devolve `null` nos dois casos; se possível, `bcrypt.compare` também contra hash dummy quando o user não existe (timing).

**Falha**

- Mensagens distintas: “e-mail não encontrado” vs “palavra-passe incorrecta”.
- Status 404 vs 401 conforme o e-mail exista.
- Tempo de resposta óbvio (return imediato sem `bcrypt` vs compare).
- Forgot-password / registo público a confirmar existência do e-mail.
- `?error=` na URL a distinguir user inexistente.

Invite (`inviteUser`) atrás de `requirePermission(users, edit)` pode dizer que o membro já está na org — não é enumeração pública.

**Como procurar**

```bash
rg -n "Credenciais|e-mail já|email já|não encontrado|não existe|Invalid credentials" src/lib/auth.ts app/(auth) src/components/auth src/use-cases --glob '*.{ts,tsx}'
rg -n "authorize|loginAction|signIn" src/lib/auth.ts app/(auth)
```

---

## 9. Headers de segurança (CSP, etc.)

Headers aplicam-se em `next.config.ts` `headers()`, `vercel.json`, ou `proxy.ts`. Neste repo, `next.config.ts` só define Cache-Control do `sw.js` — ausência de CSP/resto é finding **sistémico** (uma linha, não por página).

**Passa** (mínimo em todas as respostas HTML)

- `Content-Security-Policy` (script/style/img/connect; `frame-ancestors 'none'` ou `'self'` no dashboard)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy` (`strict-origin-when-cross-origin` ou mais apertada)
- `X-Frame-Options: DENY` ou `SAMEORIGIN` (redundante se CSP `frame-ancestors` existir)
- `Permissions-Policy` a desligar câmera/mic/geolocation se não forem usados
- `Strict-Transport-Security` em produção HTTPS (Vercel pode injectar HSTS; confirmar, não duplicar o finding se já estiver na edge)

**Falha**

- Nenhum dos headers acima no `next.config.ts` / `vercel.json` / `proxy.ts`.
- CSP com `unsafe-inline` **e** `unsafe-eval` em `script-src` sem nonce/hash (Média se CSP existe; Alta se não há CSP nenhum).
- `X-Frame-Options: ALLOWALL` ou CSP `frame-ancestors *` no dashboard (clickjacking).

Não exigir CSP perfeita à primeira. Reportar falta total como Alta; CSP presente mas frouxa como Média.

**Como procurar**

```bash
rg -n "Content-Security-Policy|X-Content-Type-Options|Referrer-Policy|X-Frame-Options|Permissions-Policy|Strict-Transport-Security" next.config.ts vercel.json proxy.ts
rg -n "headers\(" next.config.ts proxy.ts
```

---

## 10. Open redirect em callbackUrl/redirectTo

Depois do login, o destino tem de ser um path **relativo da mesma origem**. Query `callbackUrl` / `redirect` / `next` passada a `signIn({ redirectTo })` ou `redirect()` sem allowlist é open redirect.

**Passa**

- Só paths que começam por `/` e **não** por `//` nem `/\`.
- Rejeitar `https:`, `http:`, `javascript:`, backslash, URL-encoded `//`.
- `proxy.ts` a gravar `callbackUrl` a partir de `pathname` interno (já relativo) está OK; o perigo é o valor chegar **outra vez** do cliente sem revalidar.

**Falha**

- `loginAction(..., callbackUrl)` → `signIn({ redirectTo: callbackUrl })` sem allowlist (`app/(auth)/login/actions.ts`).
- `searchParams.callbackUrl` / `redirectTo` / `next` usado em `redirect()`, `NextResponse.redirect`, `router.push` no servidor sem filtro.
- Allowlist que aceita `//evil.com` ou `https://evil.com`.

Isto **não** é CSRF nem SSRF: o browser é que navega para o destino após auth.

**Como procurar**

```bash
rg -n "callbackUrl|redirectTo|searchParams\.(redirect|next)" app src proxy.ts --glob '*.{ts,tsx}'
```

---

## 11. Rate limit no login e em writes públicos

Enumeração (falha 8) é mensagem. Isto é **volume**: brute-force de passwords e abuso de endpoints públicos. O limite tem de correr **no servidor** (Upstash / in-memory em `src/lib/rate-limit.ts` ou no use case), não só `disabled` no botão.

Neste repo já há limite em reserva pública, landing e unsubscribe. O **login não** está nessa lista.

**Passa**

- Login (`loginAction` / `authorize`) com limite por IP (e, se possível, por e-mail).
- Writes públicos com limite: criar reserva (`create-booking`), POST unsubscribe, vistas/landing se forem baratas de abusar.
- Em produção o limiter não pode ser só in-memory (várias instâncias); Upstash já é o padrão deste repo.

**Falha**

- Login sem `get*RateLimiter` / `limit(` / equivalente.
- Nova action/route pública que cria dados (reserva, contacto, upload) sem limite no servidor.
- Limite só no cliente (`isPending`, debounce).

Dashboard autenticado (campanhas, clientes) não exige o mesmo limite de IP; o login e a landing pública sim.

**Como procurar**

```bash
rg -n "getBookingRateLimiter|getLandingRateLimiter|getUnsubscribeRateLimiter|rate-limit" src app proxy.ts --glob '*.{ts,tsx}'
rg -n "loginAction|authorize" src/lib/auth.ts app/(auth)
```

Cruzar: cada rota pública de escrita ou auth tem de aparecer no limiter. Login ausente → Alta.

---

## Ordem de trabalho

Copiar e ir marcando:

```
- [ ] 1. RLS / isolamento tenant (schema + migrations + queries)
- [ ] 2. Autorização no servidor (actions/API → use case → requirePermission)
- [ ] 3. IDOR (where por id inclui dono/tenant)
- [ ] 4. Segredos (env servidor vs NEXT_PUBLIC / literais / demo no login)
- [ ] 5. Validação Zod no servidor + tipo de upload no servidor
- [ ] 6. CSRF em server actions / APIs que mutam
- [ ] 7. SSRF (só se o servidor fetchar URLs de input; guardar URL não conta)
- [ ] 8. Enumeração de e-mails no login
- [ ] 9. Headers (CSP, nosniff, referrer, frame, HSTS)
- [ ] 10. Open redirect (callbackUrl / redirectTo allowlist)
- [ ] 11. Rate limit no login e writes públicos
- [ ] Relatório com as 11 falhas (incluindo as sem findings)
```

1. Listar superfície (schema, actions, APIs, uploads, env, login, next.config, rate-limit) no âmbito.
2. Correr as buscas de cada falha.
3. Abrir os matches e confirmar (não reportar falso positivo óbvio: `where: { id, tenantId }`; URL gravada sem `fetch`; `callbackUrl` já filtrado para path `/...`).
4. Emitir a tabela. Parar. Não implementar fixes.
