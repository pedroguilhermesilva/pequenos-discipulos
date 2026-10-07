# Serviços — Pequenos Discípulos

Camada de negócio da aplicação (`src/lib/services/`).

## Auth e sessão

- **NextAuth:** `src/auth.ts` — Credentials (email/senha) + Google opcional.
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

## AudioService

Gera e cacheia áudio por adaptação (`AudioAsset` + Vercel Blob privado).

- **Narração da história:** uma síntese TTS para o texto completo (`story-narration@<voz>` no cache), com alinhamento **por palavra** (timepoints SSML `<mark>` do Google TTS v1beta1). Slices por página em `narration-alignment.ts`. Campo `storyNarrationVoice` no conteúdo invalida cache ao mudar voz.
- **Blocos interactivos:** TTS curto (`generateSpeech`) ou SFX ElevenLabs conforme `resolve-block-audio.ts`.
- **LGPD:** o texto enviado ao TTS vem só do conteúdo da história — nunca o apelido da criança (`ChildProfile.name`).

**Providers:**

| Provider | Env | Uso |
|----------|-----|-----|
| `GoogleTtsProvider` | `GOOGLE_TTS_API_KEY` **ou** `GOOGLE_TTS_CREDENTIALS_JSON`, `GOOGLE_TTS_VOICE` (default `pt-BR-Neural2-C`) | Narração + timestamps |
| `StubTtsProvider` | `TTS_USE_STUB=true` ou sem credenciais Google | Dev / CI |
| `ElevenLabsSfxProvider` | `ELEVENLABS_API_KEY` | Efeitos sonoros (removido no #5) |

Autenticação Google TTS:

1. **API key** — `GOOGLE_TTS_API_KEY`; restringir à API Cloud Text-to-Speech no Google Cloud Console.
2. **Service account** — `GOOGLE_TTS_CREDENTIALS_JSON` com `client_email` + `private_key`; OAuth bearer no servidor (via `jose`).

Ver comparativo de vozes: `docs/google-tts-voices-pt-br.md`.

## Armazenamento de áudio

- **Produção/preview (Vercel):** `BlobStorageProvider` quando `BLOB_READ_WRITE_TOKEN` está definido — store privado `pequenos-discipulos-audio` (fra1). URLs servidas via `/api/storage/...` (nunca URL privada do Blob nem o token).
- **Local:** `LocalStorageProvider` grava em `./storage/` com o mesmo proxy `/api/storage/...`.
- **Autorização:** `StorageAccessService` — só entrega ficheiro se existir `AudioAsset` registado **e** o utilizador tiver `UserStory` ou tiver criado a adaptação.

## Índice bíblico

Metadados em `data/bible/index.json` — livros, abreviações, testamentos, versículos por capítulo. Usado pela UI para seleção/validação; **não** inclui texto dos versículos.

## ChildProfileService

CRUD de perfis de criança; limites por plano via `PlanLimitsService`.

**Actions:** `src/lib/profiles/actions.ts`.

O perfil guarda um **apelido** (campo `name` / `childName` nas preferências) — nunca é enviado ao LLM nem ao TTS.

## UserDataService (LGPD)

Exportação, exclusão de conta e registo de consentimento.

- **`recordConsent(userId, version)`** — grava `consentAcceptedAt` + `consentVersion` no `User`.
- **`exportUserData(userId)`** — JSON com dados da conta (isolamento por `userId`).
- **`deleteAccount(userId)`** — anonimiza adaptações comunitárias (`createdByUserId → null`), apaga áudios privados no Blob usados só por este utilizador, depois apaga o `User` (cascade).

**Actions:** `src/lib/privacy/actions.ts`  
**API:** `GET /api/account/export` (autenticada, download JSON)  
**Páginas legais:** `/privacidade`, `/termos`  
**Consentimento OAuth:** `/consentimento` (redirect via `src/proxy.ts` se `consentVersion` em falta)

Versão actual dos termos: `CURRENT_CONSENT_VERSION` em `src/lib/privacy/constants.ts`.

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
| `GOOGLE_TTS_*` / `TTS_USE_STUB` | Narração TTS (Google) |
| `ELEVENLABS_*` | SFX (ElevenLabs, até #5) |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate limit partilhado (prod) |
| `BLOB_READ_WRITE_TOKEN` | Áudio privado no Vercel Blob (prod/preview) |
