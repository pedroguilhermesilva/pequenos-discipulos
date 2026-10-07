# Roteiro manual — Issue #4 (Google TTS)

## Pré-requisitos

```bash
cp .env.example .env
# Preencher DATABASE_URL, AUTH_SECRET, BLOB_READ_WRITE_TOKEN (ou omitir para ./storage local)
# Google TTS: GOOGLE_TTS_API_KEY=... OU GOOGLE_TTS_CREDENTIALS_JSON='{"client_email":"...","private_key":"..."}'
# GOOGLE_TTS_VOICE=pt-BR-Neural2-C
# SFX (opcional): ELEVENLABS_API_KEY=...
# Sem credenciais Google: TTS_USE_STUB=true

npm install && npm run db:migrate && npm run db:seed
npm run dev
```

Login: `dev@pequenos-discipulos.local` / `devpassword123`

## Caso feliz — narração com highlight

1. Abrir uma história com texto (modo leitura / áudio).
2. Clicar em **Ouvir narração da página**.
3. **Esperado:** áudio reproduz; palavras destacam-se em laranja sincronizadas com a voz.
4. Avançar para a página seguinte durante a reprodução.
5. **Esperado:** highlight e áudio continuam no trecho da nova página (mesmo ficheiro MP3, offsets por página).
6. Voltar à mesma história noutra sessão.
7. **Esperado:** narração carrega de imediato (cache `AudioAsset` + `storyNarrationAlignment`).

## Stub (sem Google)

1. Definir `TTS_USE_STUB=true` e reiniciar `npm run dev`.
2. Repetir passos 1–3.
3. **Esperado:** WAV silencioso; highlight ainda avança palavra a palavra (timings do stub).

## Erro / aviso

1. Remover `GOOGLE_TTS_API_KEY` e `GOOGLE_TTS_CREDENTIALS_JSON`, manter `TTS_USE_STUB` vazio.
2. Reiniciar — TTS cai no stub automaticamente (comportamento dev).

3. Com credencial inválida (`GOOGLE_TTS_API_KEY=invalid`) e `TTS_USE_STUB` vazio:
4. Gerar narração numa história nova.
5. **Esperado:** mensagem amigável (credenciais inválidas / API não ativada), sem crash da app.

## LGPD (regressão)

- Confirmar que o apelido da criança no perfil **não** aparece no texto narrado nem nos pedidos de rede (DevTools → `/api/audio/narration`).
