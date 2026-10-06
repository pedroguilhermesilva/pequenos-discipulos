# Serviços — Pequenos Discípulos

Camada de negócio da aplicação (`src/lib/services/`).

## Auth e sessão

- **NextAuth:** `src/auth.ts` — Credentials (email/senha) + Google opcional.
- **Sessão nas APIs:** `requireCurrentUser()` em `src/lib/auth/get-current-user.ts`.
- **Parent gate:** `src/lib/auth/parent-gate.ts` + `POST /api/parent-gate/verify` — cookie JWT antes de votar/aprovar.
- **Rate limit:** `src/lib/rate-limit.ts` — login (`/api/auth/login`), registo (`/api/auth/register`).

## StoryGenerationService

Gera ou reutiliza adaptações de passagens bíblicas.

**Entrada:** `generateStoryInputSchema` (`passageSlug`, `ageTier`, `contentType`, `mode`, `currentAdaptationId`, …).

**Fluxo:**

1. Até 3 visualizações cache de adaptações de **outros** utilizadores (mesma chave de passagem/idade/estilo).
2. Se esgotado, gera via LLM e regista `createdByUserId`.
3. Regista `AdaptationView` para tracking.

**API:** `POST /api/stories/generate` (autenticada).

## StoryCacheService

Seleção aleatória de adaptações já existentes, excluindo as do próprio utilizador e as já vistas.

## BibleTextService

Texto bíblico via `LocalBibleTextProvider` (ALM1911 embutida).

## ChildProfileService

CRUD de perfis de criança; limites por plano via `PlanLimitsService`.

**Actions:** `src/lib/profiles/actions.ts`.

## VoteService

Votos e aprovação familiar — **sempre** atrás de parent gate validado no servidor (`/api/votes`).

## Variáveis de ambiente relevantes

| Variável | Uso |
|----------|-----|
| `DATABASE_URL` / `DIRECT_URL` | Postgres (Neon) |
| `AUTH_SECRET` / `AUTH_URL` | NextAuth |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth opcional |
| `LLM_*` | Geração de histórias |
| `ELEVENLABS_*` / `TTS_USE_STUB` | Áudio |
