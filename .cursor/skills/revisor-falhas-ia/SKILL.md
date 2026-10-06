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
  segurança, features novas com Prisma/Neon, NextAuth, serviços em
  src/lib/services/, rotas app/api, geração de histórias, votos, parent gate,
  áudio/TTS, auth/login, next.config, proxy.ts, e quando o utilizador
  mencionar RLS, IDOR, secrets, CSRF, SSRF, CSP, enumeração, open redirect,
  rate limit, autorização, validação ou estas falhas.
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

## Arquitetura deste repo (contexto)

- **BD:** PostgreSQL (Neon) via Prisma — `prisma/schema.prisma`, `DATABASE_URL` + `DIRECT_URL`.
- **Auth:** NextAuth (Auth.js) em `src/auth.ts`; sessão JWT; helpers em `src/lib/auth/get-current-user.ts` (`requireCurrentUser`, `getCurrentUserId`, cookie `active_child_profile_id`).
- **Conta vs perfis:** `User` = pais; `ChildProfile.userId` = dono; histórias em `UserStory` com `userId` + `childProfileId`.
- **Lógica de negócio:** `src/lib/services/` (não existe `src/use-cases/`).
- **Dados:** `src/lib/repositories/`; wiring em `src/lib/container.ts`.
- **Entrada/saída:** Server Actions (`src/lib/**/actions.ts`) e Route Handlers (`src/app/api/**/route.ts`).
- **Domínio partilhado:** Zod em `src/lib/domain/schemas.ts`.
- **Proteção de rotas:** `src/proxy.ts` (redirect para `/login` se sem sessão).
- **Áreas sensíveis:** geração/cache (`StoryGenerationService`, `StoryCacheService`), votos (`VoteService` + parent gate), áudio (`AudioService`, ElevenLabs/local stub).

## Quando aplicar

Aplicar automaticamente quando:

- o utilizador pede revisão, auditoria, PR review, code review, ou estas falhas
- há mudanças em `prisma/`, `src/lib/services/`, `src/lib/repositories/`, `src/lib/**/actions.ts`, `src/app/api/`, env, auth, login, `next.config.ts`, `src/proxy.ts`
- o pedido envolve RLS, IDOR, secrets, API keys, autorização, validação, CSRF, SSRF, CSP, headers, enumeração de e-mails, open redirect, callbackUrl, parent gate, rate limit ou geração de histórias

Não aplicar em copy de UI, descrições Asana, ou refactors sem impacto em dados/auth/input/headers.

## Âmbito

1. Se o utilizador indicar ficheiros/PR/branch → esse âmbito.
2. Se for revisão de PR / “o que mudou” → diff vs base (`feat/prisma-layered-architecture`, `main` ou branch indicada).
3. Caso contrário (auditoria / “todo o projeto”) → repositório completo, priorizando:
   - `prisma/schema.prisma` e `prisma/migrations/`
   - `src/lib/services/` (lógica de negócio — **fonte de verdade**)
   - `src/lib/repositories/`, `src/lib/container.ts`
   - `src/lib/**/actions.ts`, `src/app/api/**`, páginas com `params.id`
   - `src/auth.ts`, `src/lib/auth/`, `src/app/login/`, `src/lib/rate-limit.ts`
   - `next.config.ts`, `src/proxy.ts`
   - `src/components/**` (falhas 2, 5, 7 — especialmente `ParentGateModal`, `StoryViewerContent`)
   - `.env*`, código cliente (`"use client"`)

## Relatório (obrigatório)

Português. Uma tabela, uma linha por finding, ordenada por gravidade:

| # | Falha | Gravidade | Local (ficheiro:linha) | Evidência | Risco |
|---|-------|-----------|------------------------|-----------|-------|

Gravidade: **Crítica** > **Alta** > **Média**. Sem findings numa falha → uma linha “nenhum finding” nessa falha (não omitir as 11).

Depois da tabela: 3–6 frases com os piores riscos e o que verificar a seguir. Sem patches.

---

## 1. Tabelas sem RLS

Neste repo a BD é **PostgreSQL (Neon) via Prisma**. Não há Supabase client. Isolamento actual = **`userId`** (conta dos pais) e, quando aplicável, **`childProfileId`** (perfil da criança) **nas queries da app**. Isso **não substitui RLS** no Postgres: um `findUnique({ where: { id } })` fura o isolamento.

**Passa**

- Modelos ligados à conta têm `userId` **ou** FK obrigatória para entidade com `userId` (ex.: `UserStory` → `User`, `ChildProfile` → `User`).
- Migrations com `ENABLE ROW LEVEL SECURITY` + `CREATE POLICY` alinhadas com `userId` / dono (quando existirem).
- Queries Prisma em dados da família incluem `userId: sessionUserId` (ou join equivalente) **e** `requireCurrentUser()` / verificação explícita de `profile.userId`.

**Falha**

- `model` novo/alterado com dados por família sem `userId` nem FK para dono.
- `prisma/migrations/` sem `ENABLE ROW LEVEL SECURITY` / `CREATE POLICY` para tabelas de utilizador (reportar **uma vez** como finding sistémico Alta se o projecto inteiro não tiver RLS; não listar cada tabela).
- Query/raw SQL sem filtro de `userId` em `UserStory`, `ChildProfile`, `Collection`, `UsageEvent`, `AdaptationVote`, etc.
- Tabela com RLS desligado, policy `USING (true)`, ou policy só no `SELECT` (writes abertos).

**Como procurar**

```bash
rg -n "ENABLE ROW LEVEL SECURITY|CREATE POLICY|ALTER TABLE" prisma/
rg -n "model " prisma/schema.prisma
rg -n "prisma\.\w+\.(findUnique|findFirst|findMany|update|delete|upsert)" src/ --glob '*.ts'
rg -n "userId|childProfileId" src/lib/repositories/ src/lib/services/ --glob '*.ts'
```

Tabelas globais/comunitárias legítimas (não marcar isolamento por `userId`): `Passage`, `PassageAdaptation` (conteúdo partilhado). Mesmo assim, mutações sensíveis (votos, aprovação) devem ir por serviço autenticado + parent gate quando aplicável.

---

## 2. Autorização decidida no frontend em vez do servidor

Esconder botões **não** é autorização. A decisão tem de estar no **servidor**: Route Handler / Server Action com `requireCurrentUser()` e regras no **serviço** (`src/lib/services/`).

**Passa**

- Route Handler (`src/app/api/**`) ou Server Action chama `requireCurrentUser()` **antes** de ler/escrever.
- Votos/aprovações: `verifyParentGateToken()` no servidor (`src/app/api/votes/route.ts`) — **não** confiar em `parentUnlocked` vindo do cliente.
- Parent gate: `POST /api/parent-gate/verify` emite cookie JWT; modal (`ParentGateModal`) só dispara UX.
- UI pode ocultar botões por UX; a API/action recusa sem sessão/gate.

**Falha**

- `parentUnlocked: true` (ou equivalente) no body JSON aceite pelo servidor como prova de gate.
- Server Action / route com Prisma ou `container.services.*` directo, sem `requireCurrentUser()`.
- `ParentGateModal` a chamar `/api/votes` **sem** passar antes por `/api/parent-gate/verify`.
- `src/proxy.ts` protege a página mas a rota API continua invocável sem auth.

**Como procurar**

```bash
rg -n "parentUnlocked|onSuccess.*fetch.*/api/votes" src/components --glob '*.{ts,tsx}'
rg -n '"use server"' src/lib --glob '*.ts'
rg -n "requireCurrentUser|getCurrentUserId|verifyParentGateToken" src/app/api src/lib --glob '*.ts'
rg -n "export async function (GET|POST|PUT|PATCH|DELETE)" src/app/api --glob '*.ts'
```

Cruzar cada `src/app/api/**/route.ts` e cada `src/lib/**/actions.ts` com auth + serviço. Action que muta dados familiares sem `requireCurrentUser()` → finding.

---

## 3. Rotas que buscam por ID sem checar o dono (IDOR)

Qualquer leitura/escrita por `id` (params, query, JSON) tem de provar que o recurso pertence ao utilizador autenticado (e ao perfil activo, se aplicável).

**Passa**

```ts
// História da família
where: { id: storyId, userId: user.id }

// Perfil de criança
where: { id: profileId, userId: user.id }
// ou, após findById:
if (profile.userId !== user.id) throw ...
```

- `getUserStoryAction` → `library.getUserStory(user.id, storyId)` (filtra `userId`).
- `setActiveChildProfile` → verifica `profile.userId === user.id` antes do cookie.
- Conteúdo comunitário (`PassageAdaptation` por `adaptationId`) pode ser legível sem ser “dono”; mutações (voto, aprovar) têm regra de negócio explícita.

**Falha**

- `findUnique` / `update` / `delete` com `where: { id }` só, em `UserStory`, `ChildProfile`, `Collection`, `ReadingProgress`, etc.
- `src/app/api/**/[id]/**` ou actions que recebem `storyId` / `adaptationId` / `childProfileId` do cliente sem re-checar `userId`.
- `GET /api/adaptations/[id]/versions` ou `POST /api/audio/generate` com `adaptationId` sem auth ou sem validar acesso.
- Serviço que altera `PassageAdaptation` só por `adaptationId` quando a acção devia estar limitada à família.

**Como procurar**

```bash
rg -n "where:\s*\{\s*id:" src/lib/repositories src/lib/services --glob '*.ts'
rg -n "params\.(id|storyId|adaptationId|profileId)" src/app --glob '*.{ts,tsx}'
rg -n "findById\(|getUserStory\(|childProfileId" src/lib --glob '*.ts'
rg -n "adaptationId" src/app/api --glob '*.ts'
```

Cada match: confirmar `userId` (ou `profile.userId`) **na mesma query ou imediatamente a seguir**. ID do cliente sem filtro de dono → Crítica.

---

## 4. Segredos/API keys expostos no código ou no bundle

Segredo = qualquer valor que autentique ou dê acesso (`AUTH_SECRET`, `DATABASE_URL`, `DIRECT_URL`, `LLM_API_KEY`, `ELEVENLABS_API_KEY`, `GOOGLE_CLIENT_SECRET`). `NEXT_PUBLIC_*` entra no bundle.

**Passa**

- Segredos só em env de servidor (`process.env.X` em `src/auth.ts`, `src/lib/services/`, `src/lib/providers/`, route handlers — **sem** `"use client"`).
- `.env*` no `.gitignore`; `.env.example` com placeholders vazios.
- Público permitido: `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` (flag booleana, não o secret).

**Falha**

- Literal `sk_`, `postgres://`, `AUTH_SECRET=`, chaves ElevenLabs/OpenAI reais em `src/`, `app/`, testes commitados.
- `NEXT_PUBLIC_` com API key, client secret ou token de escrita.
- Segredo importado para ficheiro `"use client"` ou passado a componente cliente.
- Palavra-passe de demo no bundle (`defaultValue=` no login). `prisma/seed.ts` e hint só em `NODE_ENV === 'development'` no login **não** são finding; pré-preencher credenciais em produção **é**.

**Como procurar**

```bash
rg -n "NEXT_PUBLIC_" src/app src/components src/lib --glob '*.{ts,tsx,js}'
rg -n "(sk_live|sk_test|AKIA|BEGIN PRIVATE|postgres://|ghp_)" src/ app/ --glob '!*.example'
rg -n "process\.env\.(AUTH_SECRET|DATABASE_URL|DIRECT_URL|LLM_API_KEY|ELEVENLABS|GOOGLE_CLIENT_SECRET)" src/ --glob '*.{ts,tsx}'
rg -n "defaultValue=|devpassword" src/app/login src/components --glob '*.{ts,tsx}'
```

Confirmar que cada `process.env` de segredo **não** está em módulo cliente. `vitest.setup.ts` / testes com `test-auth-secret` fake não é finding.

---

## 5. Input do usuário sem validação/sanitização e upload sem checar tipo de arquivo

Validação no cliente é UX. A fonte de verdade é **Zod no servidor** (`src/lib/domain/schemas.ts` ou schema inline na route), aplicada ao input **antes** de persistir ou chamar providers externos.

**Passa**

- Route/service: `generateStoryInputSchema.parse(...)`, `voteSchema.parse(...)`, schemas em `/api/auth/login`, `/api/auth/register`, `/api/parent-gate/verify`, `/api/audio/generate`.
- Preferências: `userPreferencesSchema` em `ChildProfileService`.
- Strings de utilizador não interpoladas em SQL raw nem em HTML (`dangerouslySetInnerHTML` só com sanitização).
- **Áudio:** inputs (`text`, `sfxPrompt`, `tagSom`) validados antes de `AudioService` / ElevenLabs; paths gerados no servidor (`LocalStorageProvider`), não paths arbitrários do cliente.

**Falha**

- `request.json()` passado a Prisma ou `container.services.*` sem `safeParse` / `.parse`.
- Query/`searchParams` usados em `where` sem whitelist/coerce (`ageTier`, `contentType` enums).
- Upload de ficheiro (`type="file"`) sem allowlist MIME no servidor — **neste repo ainda não há upload de utilizador**; se aparecer, aplicar a mesma regra.
- HTML de história/adaptação renderizado cru a partir de input LLM sem schema (`adaptationContentSchema` é o padrão).

**Como procurar**

```bash
rg -n "request\.json\(\)|searchParams\.get" src/app/api src/lib --glob '*.ts'
rg -n "dangerouslySetInnerHTML|\$queryRaw|\$executeRaw" src/ --glob '*.{ts,tsx}'
rg -n "safeParse|\.parse\(" src/lib/domain src/app/api src/lib/services --glob '*.ts'
rg -n "type=[\"']file[\"']|upload|FormData" src/ --glob '*.{ts,tsx}'
```

Cada route/action com JSON: tem de existir schema Zod **no servidor**. Validação só no form React → finding.

---

## 6. CSRF em server actions

Next.js App Router valida `Origin`/`Host` nas Server Actions. Isso **não** cobre Route Handlers (`src/app/api/**`) nem actions se `allowedOrigins` estiver aberto.

**Passa**

- Mutações via `"use server"` (`src/lib/profiles/actions.ts`, `src/lib/stories/library-actions.ts`, etc.) com cookies de sessão NextAuth; sem `serverActions.allowedOrigins: ["*"]`.
- Route Handlers que mutam: **POST** (não GET), auth via `requireCurrentUser()` ou rotas públicas documentadas (`/api/auth/login`, `/api/auth/register`).
- Cookies `SameSite=Lax` (parent gate, active child profile).

**Falha**

- `serverActions.allowedOrigins` com `*` em `next.config.ts`.
- `src/app/api/**` que muta estado em **GET**.
- `Access-Control-Allow-Origin: *` com credenciais em rotas autenticadas por cookie.
- Login/registo invocável cross-origin porque a origem check foi desligada.

**Como procurar**

```bash
rg -n "allowedOrigins|serverActions" next.config.ts
rg -n "export async function GET" src/app/api --glob '*.ts'
rg -n "Access-Control-Allow-Origin" src/ next.config.ts src/proxy.ts
rg -n '"use server"' src/lib --glob '*.ts'
```

---

## 7. SSRF (as URLs são guardadas, o servidor não as fetcha)

Neste produto, paths de áudio (`audioPath`, `narrationAudioPath`) e URLs estáticas são **persistidos e servidos** pelo browser ou storage local. O servidor **não** deve fazer `fetch` a URLs arbitrárias do cliente.

**Passa**

- `fetch` server-side só para APIs conhecidas: OpenAI (`LLM_BASE_URL`), ElevenLabs (`ELEVENLABS_BASE_URL`), endpoints internos fixos.
- Índice bíblico: metadados estáticos em `data/bible/index.json` — sem fetch HTTP a URL de utilizador.

**Falha (SSRF de verdade)**

- Servidor faz `fetch` / `axios` a URL construída a partir de input do cliente ou campo da BD (webhook, “validar URL”, proxy de áudio externo).
- Pedido a `localhost`, `127.0.0.1`, `169.254.169.254`, IPs privados.

Não reportar SSRF só porque existe `audioPath` na BD ou `<audio src={url}>`. `javascript:` / `data:` em href é XSS (falha 5), não SSRF.

**Como procurar**

```bash
rg -n "fetch\(|axios|got\(|undici" src/ --glob '*.{ts,tsx}'
rg -n "audioPath|narrationAudioPath|baseUrl" src/lib/services src/lib/providers --glob '*.ts'
```

Cada `fetch(`: URL constante/env → OK. URL de body/params/BD → Crítica.

---

## 8. Enumeração de e-mails no login

O login não pode revelar se um e-mail existe. Mesma mensagem, status coerente, custo semelhante (não saltar o `bcrypt` quando o user não existe).

Padrão neste repo: `INVALID_CREDENTIALS_MESSAGE` / `"Credenciais inválidas."` em `src/auth.ts`, `/api/auth/login`, página de login.

**Passa**

- Uma única mensagem genérica (e-mail desconhecido **e** password errada).
- Registo público (`/api/auth/register`) com mensagem genérica (`GENERIC_REGISTER_FAILURE`), sem “e-mail já registado”.
- `authorizeCredentials` devolve `null` nos dois casos; `bcrypt.compare` contra `DUMMY_PASSWORD_HASH` quando user não existe.

**Falha**

- Mensagens distintas: “e-mail não encontrado” vs “palavra-passe incorrecta”.
- Status 404 vs 401 conforme o e-mail exista.
- Return imediato sem `bcrypt` quando user não existe (timing).
- `?error=` na URL a distinguir user inexistente vs password errada.

**Como procurar**

```bash
rg -n "Credenciais|e-mail já|email já|não encontrado|não existe|Invalid credentials|GENERIC_REGISTER" src/auth.ts src/app/api/auth src/app/login --glob '*.{ts,tsx}'
rg -n "authorizeCredentials|authorize\(" src/auth.ts src/app/api/auth --glob '*.ts'
```

---

## 9. Headers de segurança (CSP, etc.)

Headers em `next.config.ts` `headers()`, `src/proxy.ts`, ou `vercel.json`.

**Passa** (mínimo em respostas HTML)

- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy`
- `X-Frame-Options: SAMEORIGIN` ou `DENY`
- `Permissions-Policy` (câmera/mic desligados se não usados)
- HSTS em produção HTTPS (Vercel edge; não duplicar finding se já injectado)

**Falha**

- Nenhum dos headers acima configurado.
- CSP com `'unsafe-inline'` **e** `'unsafe-eval'` em `script-src` sem nonce/hash (Média se CSP existe; Alta se não há CSP).
- `frame-ancestors *` em área autenticada (clickjacking).

**Como procurar**

```bash
rg -n "Content-Security-Policy|X-Content-Type-Options|Referrer-Policy|X-Frame-Options|Permissions-Policy" next.config.ts src/proxy.ts vercel.json
rg -n "headers\(" next.config.ts
rg -n "response\.headers\.set" src/proxy.ts
```

---

## 10. Open redirect em callbackUrl/redirectTo

Depois do login, o destino tem de ser um path **relativo da mesma origem**. Query `callbackUrl` passada a `signIn('google', { callbackUrl })` ou `router.push` tem de ser filtrada.

**Passa**

- `sanitizeCallbackPath` em `src/lib/auth/safe-redirect.ts` (servidor) e `safe-redirect-client.ts` (cliente).
- Só paths que começam por `/` e **não** por `//` nem `/\`.
- `src/proxy.ts` grava `callbackUrl` a partir de `pathname` interno; login revalida no cliente.

**Falha**

- `searchParams.callbackUrl` usado em `redirect()`, `NextResponse.redirect`, `router.push` ou `signIn({ callbackUrl })` **sem** `sanitizeCallbackPath`.
- Allowlist que aceita `//evil.com` ou `https://evil.com`.

**Como procurar**

```bash
rg -n "callbackUrl|redirectTo|searchParams\.(redirect|next)" src/app src/proxy.ts src/lib/auth --glob '*.{ts,tsx}'
rg -n "signIn\(" src/app/login --glob '*.{ts,tsx}'
```

---

## 11. Rate limit no login e em writes públicos

Enumeração (falha 8) é mensagem. Isto é **volume**: brute-force e abuso de endpoints públicos. O limite tem de correr **no servidor** (`src/lib/rate-limit.ts` → `checkRateLimit`), não só `disabled` no botão.

**Passa**

- Login: `POST /api/auth/login` com limite por IP e e-mail (`login:ip:`, `login:email:`).
- Registo: `POST /api/auth/register` com limite por IP (`register:ip:`).
- Em produção multi-instância (Vercel): limiter partilhado (Redis/Upstash) — in-memory **só** aceitável em dev/staging.

**Falha**

- Login/registo sem `checkRateLimit` / equivalente.
- Nova route pública que cria dados (`/api/auth/register`, futuros contact forms) sem limite.
- Limite só no cliente (`disabled`, debounce).

Rotas autenticadas (`/api/stories/generate`, `/api/votes`) não exigem o mesmo limite de IP público; login e registo **sim**.

**Como procurar**

```bash
rg -n "checkRateLimit|getClientIp" src/app/api src/auth.ts src/lib/rate-limit.ts --glob '*.ts'
rg -n "export async function POST" src/app/api/auth --glob '*.ts'
```

Cruzar: cada rota pública de auth/registo tem de usar `checkRateLimit`. Login ausente → Alta.

---

## 12. CSP permissiva (`unsafe-inline` / `unsafe-eval`)

Além dos headers mínimos (falha 9), inspecionar a **política CSP** em `next.config.ts` `headers()`, `src/proxy.ts`, ou `vercel.json`.

**Passa**

- `script-src` sem `'unsafe-inline'` **e** sem `'unsafe-eval'`, **ou**
- Nonce/hash explícito para scripts inline (Next.js 16: nonce via middleware/proxy — ver docs oficiais).

**Falha (Média)**

- `'unsafe-inline'` e/ou `'unsafe-eval'` em `script-src` sem estratégia de nonce ou hash.
- Wildcards permissivos em `script-src` (ex.: `*` ou `https:`) em área autenticada.
- CSP ausente quando a app serve HTML com scripts (Alta — ver também falha 9).

**Onde procurar**

```bash
rg -n "Content-Security-Policy|script-src|unsafe-inline|unsafe-eval" next.config.ts src/proxy.ts vercel.json
rg -n "nonce|strict-dynamic" next.config.ts src/proxy.ts src/middleware.ts
```

**Correcção recomendada (Next.js 16)**

- Gerar nonce por pedido em `src/proxy.ts` (ou middleware) e injectar na CSP.
- Remover `'unsafe-inline'` / `'unsafe-eval'` de `script-src` quando nonce estiver activo.
- Referência: [Next.js Content Security Policy](https://nextjs.org/docs/app/guides/content-security-policy).

---

## Ordem de trabalho

Copiar e ir marcando:

```
- [ ] 1. RLS / isolamento por userId (schema + migrations + queries)
- [ ] 2. Autorização no servidor (actions/API → services → requireCurrentUser / parent gate)
- [ ] 3. IDOR (where por id inclui userId ou profile.userId)
- [ ] 4. Segredos (env servidor vs NEXT_PUBLIC / literais / demo no login)
- [ ] 5. Validação Zod no servidor (schemas.ts + routes)
- [ ] 6. CSRF em server actions / APIs que mutam
- [ ] 7. SSRF (só se o servidor fetchar URLs de input; guardar path/URL não conta)
- [ ] 8. Enumeração de e-mails no login/registo
- [ ] 9. Headers (CSP, nosniff, referrer, frame, HSTS)
- [ ] 10. Open redirect (callbackUrl allowlist)
- [ ] 11. Rate limit no login e registo público
- [ ] 12. CSP permissiva (unsafe-inline/eval, nonce, wildcards)
- [ ] Relatório com as 12 falhas (incluindo as sem findings)
```

1. Listar superfície (schema, services, repositories, actions, APIs, auth, parent gate, geração/cache, áudio, env, login, next.config, proxy, rate-limit) no âmbito.
2. Correr as buscas de cada falha.
3. Abrir os matches e confirmar (não reportar falso positivo óbvio: `where: { id, userId }`; `PassageAdaptation` comunitário legível; `callbackUrl` já filtrado; `fetch` só para LLM/ElevenLabs).
4. Emitir a tabela. Parar. Não implementar fixes.
