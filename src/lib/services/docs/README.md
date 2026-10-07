# Serviços — Pequenos Discípulos

Camada de negócio da aplicação (`src/lib/services/`).

## Auth e sessão

- **NextAuth:** `src/auth.ts` — Credentials (email/senha) + Google opcional.
- **CSP / headers:** `src/lib/security/csp.ts` + `src/proxy.ts` — nonce por pedido; `script-src` com `strict-dynamic` em produção (sem `unsafe-inline`/`unsafe-eval`); `style-src` com `'unsafe-inline'` (React usa `style={}` sem nonce); preview (`VERCEL_ENV=preview`) usa allowlist `vercel.live` sem `strict-dynamic` para o toolbar.
- **Sessão nas APIs:** `requireCurrentUser()` em `src/lib/auth/get-current-user.ts`.
- **Parent gate:** `src/lib/auth/parent-gate.ts` + `POST /api/parent-gate/verify` — cookie JWT antes de votar/aprovar.
- **Rate limit:** `src/lib/rate-limit.ts` — login (`/api/auth/login`), registo (`/api/auth/register`). Upstash Redis quando `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` estão definidos; fallback in-memory em dev.

## StoryGenerationService

Gera ou reutiliza adaptações de passagens bíblicas.

**Entrada:** `generateStoryInputSchema` (`passageSlug`, `ageTier`, `contentType`, `mode`, `currentAdaptationId`, …).

**Fluxo:**

1. Até 3 visualizações cache de adaptações de **outros** utilizadores (mesma chave de passagem/idade/estilo), servidas pela **maior `voteScore`** (empate → aleatório).
2. Se esgotado, gera via LLM com **apenas a referência bíblica** (sem texto integral no repo).
3. Regista `AdaptationView` para tracking.

**API:** `POST /api/stories/generate` (autenticada).

## StoryCacheService

Seleção de adaptações já existentes por `voteScore`, excluindo as do próprio utilizador e as já vistas.

## Armazenamento de áudio

- **Produção/preview (Vercel):** `BlobStorageProvider` quando `BLOB_READ_WRITE_TOKEN` está definido — store privado `pequenos-discipulos-audio` (fra1). URLs servidas via `/api/storage/...` (nunca URL privada do Blob nem o token).
- **Local:** `LocalStorageProvider` grava em `./storage/` com o mesmo proxy `/api/storage/...`.
- **Autorização:** `StorageAccessService` — só entrega ficheiro se existir `AudioAsset` registado **e** o utilizador tiver `UserStory` ou tiver criado a adaptação.

## Índice bíblico

Metadados em `data/bible/index.json` — livros, abreviações, testamentos, versículos por capítulo. Usado pela UI para seleção/validação; **não** inclui texto dos versículos.

## ChildProfileService

CRUD de perfis de criança; limites por plano via `PlanLimitsService`.

**Actions:** `src/lib/profiles/actions.ts`.

## VoteService

Votos e aprovação familiar — **sempre** atrás de parent gate validado no servidor (`/api/votes`).

- **Voto:** permitido em adaptações comunitárias de outros utilizadores; um voto por utilizador/adaptação (`AdaptationVote` unique).
- **Aprovar/partilhar:** apenas adaptações da família (criadas pelo utilizador ou ligadas via `UserStory`).

## Variáveis de ambiente relevantes

| Variável | Uso |
|----------|-----|
| `DATABASE_URL` / `DIRECT_URL` | Postgres (Neon) |
| `AUTH_SECRET` / `AUTH_URL` | NextAuth |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth opcional |
| `LLM_*` | Geração de histórias |
| `ELEVENLABS_*` / `TTS_USE_STUB` | Áudio |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate limit partilhado (prod) |
| `BLOB_READ_WRITE_TOKEN` | Áudio privado no Vercel Blob (prod/preview) |
