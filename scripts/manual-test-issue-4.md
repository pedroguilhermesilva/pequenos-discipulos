# Roteiro manual — Issue #4 (Google TTS / Gemini Flash)

## Pré-requisitos

```bash
cp .env.example .env
# Preencher DATABASE_URL, AUTH_SECRET, BLOB_READ_WRITE_TOKEN (ou omitir para ./storage local)
# Gemini Flash TTS (padrão):
#   GOOGLE_TTS_API_KEY=...
#   GOOGLE_CLOUD_PROJECT_ID=seu-projeto-gcp
#   GOOGLE_TTS_PROVIDER=gemini
#   GOOGLE_TTS_MODEL=gemini-2.5-flash-tts
#   GOOGLE_TTS_GEMINI_VOICE=Leda
# Neural2 (alternativa):
#   GOOGLE_TTS_PROVIDER=neural2
#   GOOGLE_TTS_VOICE=pt-BR-Neural2-C
# Sem credenciais Google: TTS_USE_STUB=true

npm install && npm run db:migrate && npm run db:seed
npm run dev
```

Login: `dev@pequenos-discipulos.local` / `devpassword123`

## Google Cloud — APIs a ativar

1. **Cloud Text-to-Speech API** (síntese Gemini / Neural2)
2. **Cloud Speech-to-Text API** (alinhamento palavra a palavra — só com provider `gemini`)

Restringir `GOOGLE_TTS_API_KEY` a estas duas APIs no Console.

## Caso feliz — narração Gemini com highlight

1. Confirmar env: `GOOGLE_TTS_PROVIDER=gemini`, credenciais válidas, `TTS_USE_STUB` vazio.
2. Abrir uma história com texto (modo leitura / áudio).
3. Clicar em **Ouvir narração da página**.
4. **Esperado:** voz mais expressiva que Neural2; palavras destacam-se em laranja sincronizadas.
5. Avançar para a página seguinte durante a reprodução.
6. **Esperado:** highlight e áudio continuam no trecho da nova página.
7. Voltar à mesma história noutra sessão.
8. **Esperado:** narração carrega de imediato (cache `AudioAsset` + `storyNarrationAlignment`).

## Alternativa Neural2

1. Definir `GOOGLE_TTS_PROVIDER=neural2` e `GOOGLE_TTS_VOICE=pt-BR-Neural2-C`.
2. Reiniciar e gerar narração numa história **nova** (cache antigo Gemini não se aplica).
3. **Esperado:** voz Neural2; highlight via timepoints SSML nativos.

## Stub (sem Google)

1. Definir `TTS_USE_STUB=true` e reiniciar `npm run dev`.
2. Repetir passos 2–4 do caso feliz.
3. **Esperado:** WAV silencioso; highlight ainda avança palavra a palavra (timings do stub).

## Erro / aviso

1. Remover credenciais Google, manter `TTS_USE_STUB` vazio → cai no stub automaticamente (dev).

2. Com credencial inválida (`GOOGLE_TTS_API_KEY=invalid`) e `TTS_USE_STUB` vazio:
3. Gerar narração numa história nova.
4. **Esperado:** mensagem amigável (credenciais inválidas / API não ativada), sem crash.

5. Com Gemini ativo mas **Speech-to-Text desativado**:
6. Gerar narração numa história nova.
7. **Esperado:** áudio toca (voz Gemini); highlight pode usar tempos estimados ou ficar desligado — app não quebra.

## Custo de referência (dez/2026)

| Item | ~US$ / história (~3 000 chars, ~3 min) |
|------|----------------------------------------|
| Gemini 2.5 Flash TTS | 0,05 – 0,07 |
| Speech-to-Text (alinhamento) | ~0,05 |
| **Total Gemini** | **~0,10 – 0,12** |
| Neural2 (alternativa) | ~0,05 (cota grátis 1M chars/mês) |

## LGPD (regressão)

- Confirmar que o apelido da criança no perfil **não** aparece no texto narrado nem nos pedidos de rede (DevTools → `/api/audio/narration`).

## Preview Vercel

1. Definir envs no projeto Vercel (Production/Preview): `GOOGLE_TTS_API_KEY`, `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_TTS_PROVIDER=gemini`.
2. Deploy do branch `cursor/google-tts-provider-ca81`.
3. Abrir preview → história → **Ouvir narração** → validar voz e highlight.
