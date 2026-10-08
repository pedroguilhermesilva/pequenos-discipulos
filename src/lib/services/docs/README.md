# Serviços — Pequenos Discípulos

Camada de negócio da aplicação (`src/lib/services/`).

## Auth e sessão

- **NextAuth:** `src/auth.ts` — Credentials (email/senha) + Google opcional.
- **Sessão nas APIs:** `requireCurrentUser()` em `src/lib/auth/get-current-user.ts`.
- **Parent gate:** `src/lib/auth/parent-gate.ts` + `POST /api/parent-gate/verify` — cookie JWT antes de votar/aprovar.
- **Rate limit:** `src/lib/rate-limit.ts` — login (`/api/auth/login`), registo (`/api/auth/register`). Upstash Redis quando `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` estão definidos; fallback in-memory em dev.

## StoryGenerationService

Gera ou reutiliza adaptações de passagens bíblicas.

**Entrada:** `generateStoryInputSchema` (`passageSlug`, `ageTier`, `contentType`, `mode`, `currentAdaptationId`, `idempotencyKey`, …).

**Fluxo:**

1. Até 3 visualizações cache de adaptações de **outros** utilizadores (mesma chave de passagem/idade/estilo), servidas pela **maior `voteScore`** (empate → aleatório). **Só entram versões com status `community` ou `as_default`** — rascunhos, recusadas e em revisão nunca entram no cache.
2. Se esgotado, gera via LLM com **apenas a referência bíblica** (sem texto integral no repo).
3. Regista `AdaptationView` para tracking.
4. **`idempotencyKey` (opcional):** evita geração duplicada quando o cliente reenvia o mesmo pedido (StrictMode, redirect, etc.). Persistido em `StoryGenerationIdempotency` (TTL ~5 min).

**Limites de plano:** `assertCanGenerate(userId, tier, contentType)` recebe o **`tier` lido do Postgres** em cada request via `requireCurrentUser()` — **não** vem do JWT. Alterar `subscriptionTier` na BD reflecte-se de imediato; não é preciso logout/login.

**Resposta:** inclui `content` (e `quiz` quando existir) para o viewer renderizar sem segundo fetch.

**URL pós-geração:** mantém `/stories/nova?…&historia=<userStoryId>&pronto=1` — evita remount ao trocar o segmento `[id]`.

**API:** `POST /api/stories/generate` (autenticada).

**Formato LLM (inline interativo):** blocos `texto` com `marcadores_interativos` (`palavra`, `texto_para_audio`, `tag_som`). O mapper (`map-pedagogical-story.ts`) converte cada marcador numa parte `word` inline; marcadores inválidos são descartados (palavra ausente, tag desconhecida, >2 por página). Histórias legadas com blocos `interativo` separados continuam a mapear para `type: interactive` (compatibilidade). Tags de som centralizadas em `src/lib/stories/sound-tag.ts` (`KNOWN_SOUND_TAGS`).

## StoryCacheService

Seleção de adaptações já existentes por `voteScore`, excluindo as do próprio utilizador e as já vistas. A chave de cache normaliza `bibleVersionId` (`alm1911`) e a pesquisa inclui aliases legados (ex.: `3254`).

## AudioService

Gera e cacheia áudio por adaptação (`AudioAsset` + Vercel Blob privado).

- **Narração da história:** uma síntese TTS para o texto completo (`story-narration@<suffix>` no cache). **Gemini Flash TTS** (default): Cloud TTS v1 + alinhamento pós-síntese via interface `NarrationAligner` (`NARRATION_ALIGNER=google|groq`). **Neural2** (alternativa): timepoints SSML `<mark>` v1beta1. Slices por página em `narration-alignment.ts`. Campo `storyNarrationVoice` guarda o suffix completo (modelo/voz/estilo) e invalida cache ao mudar config.
- **Blocos interactivos:** TTS curto (`generateSpeech`) ou SFX ElevenLabs conforme `resolve-block-audio.ts`.
- **LGPD:** o texto enviado ao TTS vem só do conteúdo da história — nunca o apelido da criança (`ChildProfile.name`).

**Providers:**

| Provider | Env | Uso |
|----------|-----|-----|
| `GeminiFlashTtsProvider` | `GOOGLE_TTS_PROVIDER=gemini`, `GOOGLE_TTS_MODEL`, `GOOGLE_TTS_GEMINI_VOICE`, `GOOGLE_TTS_STYLE_PROMPT`, `GOOGLE_CLOUD_PROJECT_ID` | Narração expressiva + `NarrationAligner` |
| `GoogleNarrationAligner` | `NARRATION_ALIGNER=google` (default no código), mesma conta de serviço | Alinhamento via Speech-to-Text v2 |
| `GroqWhisperNarrationAligner` | `NARRATION_ALIGNER=groq`, `GROQ_API_KEY` (**recomendado**) | Alinhamento via Whisper Large v3 Turbo |
| `GoogleTtsProvider` | `GOOGLE_TTS_PROVIDER=neural2`, `GOOGLE_TTS_VOICE` (default `pt-BR-Neural2-C`) | Narração + timepoints SSML nativos |
| `StubTtsProvider` | `TTS_USE_STUB=true` | Dev / CI |
| `UnconfiguredTtsProvider` | sem `GOOGLE_TTS_CREDENTIALS_JSON` | Falha só ao pedir narração: "Narração não configurada: falta GOOGLE_TTS_CREDENTIALS_JSON." |
| `ElevenLabsSfxProvider` | `ELEVENLABS_API_KEY` | Efeitos sonoros (removido no #5) |

Autenticação Google TTS (só conta de serviço):

1. **Service account** — `GOOGLE_TTS_CREDENTIALS_JSON` com `client_email` + `private_key` + `project_id`; OAuth bearer no servidor (via `jose`, escopo `cloud-platform`, token em cache). Papel necessário: "Usuário da Plataforma de Agentes" (`roles/aiplatform.user`).
2. **Projeto** — `GOOGLE_CLOUD_PROJECT_ID` opcional; sem ele usa o `project_id` do JSON.

Ver comparativo de vozes: `docs/google-tts-voices-pt-br.md`.

## Armazenamento de áudio

- **Produção/preview (Vercel):** `BlobStorageProvider` quando `BLOB_READ_WRITE_TOKEN` está definido — store privado `pequenos-discipulos-audio` (fra1). URLs servidas via `/api/storage/...` (nunca URL privada do Blob nem o token).
- **Local:** `LocalStorageProvider` grava em `./storage/` com o mesmo proxy `/api/storage/...`.
- **Autorização:** `StorageAccessService` — só entrega ficheiro se existir `AudioAsset` registado **e** o utilizador tiver `UserStory` ou tiver criado a adaptação.

## Índice bíblico

Metadados em `data/bible/index.json` — livros, abreviações, testamentos, versículos por capítulo. Usado pela UI para seleção/validação; **não** inclui texto dos versículos.

## ChildProfileService

CRUD de perfis de criança; limites por plano via `PlanLimitsService`.

**Actions:** `src/lib/profiles/actions.ts` — `setActiveChildProfile`, `getActiveChildProfileIdAction`, `deleteChildProfileAction`, etc.

**Perfil ativo:** cookie httpOnly `active_child_profile_id` (`getCurrentChildProfileId()`). Um único `ChildProfileProvider` envolve a app em `QueryProvider` (layout). Recarrega a lista quando o utilizador autenticado muda (login/logout/troca de conta) via `useSession`; respostas `UNAUTHORIZED` não contam como “0 filhos”. Troca de filho: estado optimista imediato + `setActiveChildProfile` em background (1 query `ChildProfile.findById`, sessão JWT sem `User.findUnique`). Biblioteca/home: `getChildStoriesAction(activeProfile.id)` (1 query, filtrada por `userId`). Ver `src/lib/profiles/profile-switch-path.ts` e `scripts/profile-switch-benchmark.ts`.

**Onboarding:** só contas com zero filhos no Postgres. Guarda de servidor em `src/lib/onboarding/guard.ts` (`ensureOnboardingAccess`) nas páginas `/onboarding/*`; redirecciona para `/home` se já existir filho e a URL não tiver `?modo=novo`. Cliente: `AppProfileGuard` + `profile-guard-logic.ts`.

**Exclusão de perfil:** `delete(userId, profileId)` exige dono (`userId`) e pelo menos 2 perfis na conta. Prisma cascade apaga `UserStory`, `Collection`, `AdaptationView` ligados ao `childProfileId`. Se o perfil excluído era o ativo, o cookie passa ao perfil restante mais antigo.

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
- **Aprovar em família:** apenas adaptações da família (criadas pelo utilizador ou ligadas via `UserStory`).
- **Compartilhar com a comunidade:** delega a `ModerationService.submitForCommunityReview` — não publica directo.

## ModerationService

Revisão antes de uma versão entrar na comunidade (issue #12).

**Estados:** `draft` → `pending_review` → (`community` | `rejected` | `pending_manual_review`).

**Checagem automática (1 chamada LLM + moderação OpenAI por partilha):**

1. Moderação de conteúdo (`OpenAiModerationProvider` — `OPENAI_MODERATION_API_KEY` ou fallback `LLM_API_KEY`).
2. Revisão LLM de fidelidade bíblica + adequação à idade (`ChatCompletionsStoryReviewProvider`).

Se a moderação OpenAI ou a revisão LLM falharem (403, rede, timeout), a versão vai para `pending_manual_review` com registo em `ModerationAuditLog` — **nunca** fica presa em `pending_review` nem devolve 500. Versões em `pending_review` há mais de 3 minutos sem `moderatedAt` podem ser reenviadas.

**Denúncias:** `POST /api/reports` — após `COMMUNITY_REPORT_THRESHOLD` (default 3), status `withdrawn`.

**Admin:** `/admin/moderacao` + `GET/POST /api/admin/moderation/*` — requer `User.isAdmin = true` (definido manualmente na BD).

**Auditoria:** `ModerationAuditLog` regista quem/o quê aprovou, recusou ou retirou, quando e porquê.

**Regras por idade:** `src/lib/llm/age-tier-rules.ts` aplicadas em **toda** geração (`story-generation.prompt.ts`).

## Variáveis de ambiente relevantes

| Variável | Uso |
|----------|-----|
| `DATABASE_URL` / `DIRECT_URL` | Postgres (Neon) |
| `AUTH_SECRET` / `AUTH_URL` | NextAuth |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth opcional |
| `LLM_*` | Geração de histórias + revisão automática na partilha |
| `OPENAI_MODERATION_API_KEY` / `OPENAI_MODERATION_BASE_URL` | Moderação OpenAI na partilha (opcional; fallback `LLM_*`) |
| `GOOGLE_TTS_*` / `TTS_USE_STUB` | Narração TTS (Google) |
| `NARRATION_ALIGNER` / `GROQ_API_KEY` | Alinhamento palavra a palavra pós-Gemini |
| `ELEVENLABS_*` | SFX (ElevenLabs, até #5) |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate limit partilhado (prod) |
| `BLOB_READ_WRITE_TOKEN` | Áudio privado no Vercel Blob (prod/preview) |
