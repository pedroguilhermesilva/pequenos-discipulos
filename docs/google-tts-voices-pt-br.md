# Comparativo de vozes pt-BR — Google Cloud Text-to-Speech

Pesquisa com base na [documentação oficial de preços](https://cloud.google.com/text-to-speech/pricing?hl=pt-BR), [Gemini-TTS](https://cloud.google.com/text-to-speech/docs/gemini-tts), [vozes compatíveis](https://cloud.google.com/text-to-speech/docs/voices?hl=pt-br), [SSML / timepoints](https://cloud.google.com/text-to-speech/docs/ssml) e [Speech-to-Text](https://cloud.google.com/speech-to-text/pricing?hl=pt-BR) (dez/2026).

## Resumo executivo

| Família | Preço (após cota grátis) | Qualidade (narração infantil) | Timepoints nativos |
|---------|--------------------------|-------------------------------|--------------------|
| **Gemini 2.5 Flash TTS** (padrão do app) | ~US$ 0,05–0,07 / história (~3 000 caracteres)* | Muito expressiva, tom natural e caloroso | **Não** — alinhamento via Speech-to-Text depois da síntese |
| **Neural2** (alternativa) | US$ 16 / 1M caracteres (1M grátis/mês) | Boa prosódia, mas soa mais robótica | **Sim** (`<mark>` + `enableTimePointing`) |
| **WaveNet** | US$ 4 / 1M caracteres | Boa relação custo/qualidade | **Sim** |
| **Chirp 3: HD** | US$ 30 / 1M caracteres | Excelente, conversacional | **Não** |

\* Estimativa para história de ~3 000 caracteres com `gemini-2.5-flash-tts`: tokens de entrada (~US$ 0,50 / 1M) + tokens de áudio (~US$ 10 / 1M, 25 tokens/s) + Speech-to-Text para alinhamento (~US$ 0,016/min). Sem cota grátis no Gemini-TTS.

## Voz padrão do app — Gemini 2.5 Flash TTS

**Provider:** `GOOGLE_TTS_PROVIDER=gemini` (default)

| Variável | Default | Descrição |
|----------|---------|-----------|
| `GOOGLE_TTS_MODEL` | `gemini-2.5-flash-tts` | Modelo Flash TTS (GA, pt-BR). Preview mais recente: `gemini-3.1-flash-tts-preview`. |
| `GOOGLE_TTS_GEMINI_VOICE` | `Leda` | Voz feminina, calorosa — boa para histórias infantis. |
| `GOOGLE_TTS_STYLE_PROMPT` | narradora calorosa… | Instruções de estilo em pt-BR (campo `input.prompt` da API). |
| `GOOGLE_TTS_LANGUAGE` | `pt-BR` | Idioma da síntese e do alinhamento. |

**API usada:** Cloud Text-to-Speech `POST /v1/text:synthesize` com `input.text`, `input.prompt`, `voice.modelName` e `voice.name`. Reutiliza `GOOGLE_TTS_API_KEY` (restrita à Cloud Text-to-Speech) ou `GOOGLE_TTS_CREDENTIALS_JSON`.

**Alinhamento palavra a palavra:** Gemini TTS não devolve timepoints. Depois da síntese, o app envia o MP3 + texto conhecido ao **Cloud Speech-to-Text v2** (`recognizers/_:recognize`) com `enableWordTimeOffsets: true`, casa as palavras transcritas com o texto original (tolerando diferenças de pontuação/acento) e produz o mesmo formato de `NarrationAlignment` usado pelo highlight. Se o alinhamento falhar (áudio longo, API indisponível, matching fraco), o áudio toca com tempos estimados ou sem destaque — a narração **não quebra**.

**Cache:** chave `story-narration@<modelo>:<voz>:<hash-do-estilo>` (ex.: `story-narration@gemini-2.5-flash-tts:Leda:a1b2c3d4`). Campo `storyNarrationVoice` no conteúdo invalida cache ao mudar modelo, voz ou prompt.

## Alternativa — Neural2 (`GOOGLE_TTS_PROVIDER=neural2`)

| Variável | Default |
|----------|---------|
| `GOOGLE_TTS_VOICE` | `pt-BR-Neural2-C` |

- **Timepoints nativos:** SSML `<mark>` + `enableTimePointing: ["SSML_MARK"]` na API **v1beta1**.
- **Cache:** `story-narration@pt-BR-Neural2-C`
- **Preço:** US$ 16 / milhão (cota grátis 1M/mês).

WaveNet (`pt-BR-Wavenet-A`, US$ 4 / milhão) continua disponível via `GOOGLE_TTS_VOICE` com provider `neural2`.

## Configuração no Google Cloud (passo a passo)

### 1. Ativar APIs

No [Google Cloud Console](https://console.cloud.google.com/) → **APIs e serviços** → **Biblioteca**:

1. **Cloud Text-to-Speech API** — síntese Gemini + Neural2
2. **Cloud Speech-to-Text API** — alinhamento pós-síntese (só necessário com provider `gemini`)

Confirme que o **faturamento** está ativo no projeto.

### 2. Criar / restringir a chave de API

**APIs e serviços** → **Credenciais** → chave de API usada na Vercel (`GOOGLE_TTS_API_KEY`):

- **Restrições de API:** permitir apenas
  - Cloud Text-to-Speech API
  - Cloud Speech-to-Text API
- **Restrições de aplicativo:** IPs/serviços conforme política (Vercel = sem restrição de IP, ou usar service account).

Alternativa mais segura: **service account** com `GOOGLE_TTS_CREDENTIALS_JSON` (`client_email` + `private_key` + `project_id`).

### 3. Variáveis na Vercel

| Variável | Obrigatória | Exemplo |
|----------|-------------|---------|
| `GOOGLE_TTS_API_KEY` | sim* | `AIza…` |
| `GOOGLE_CLOUD_PROJECT_ID` | sim (Gemini) | `meu-projeto-123` |
| `GOOGLE_TTS_PROVIDER` | não | `gemini` |
| `GOOGLE_TTS_MODEL` | não | `gemini-2.5-flash-tts` |
| `GOOGLE_TTS_GEMINI_VOICE` | não | `Leda` |
| `GOOGLE_TTS_STYLE_PROMPT` | não | narradora calorosa… |
| `GOOGLE_TTS_LANGUAGE` | não | `pt-BR` |
| `TTS_USE_STUB` | não | `false` |

\* Ou `GOOGLE_TTS_CREDENTIALS_JSON` (neste caso `project_id` no JSON substitui `GOOGLE_CLOUD_PROJECT_ID`).

Para voltar ao Neural2:

```
GOOGLE_TTS_PROVIDER=neural2
GOOGLE_TTS_VOICE=pt-BR-Neural2-C
```

### 4. Privacidade / LGPD

- Texto narrado = conteúdo da história (nunca apelido da criança).
- Cloud TTS e Speech-to-Text no plano pago **não usam os dados para treinar** modelos (ver [termos Google Cloud](https://cloud.google.com/terms)).
- Não usamos a Gemini API (AI Studio) — só APIs Google Cloud com a mesma chave/projeto.

## Custo estimado por história (~3 000 caracteres, ~3 min de áudio)

| Item | Estimativa |
|------|------------|
| Gemini 2.5 Flash TTS (síntese) | US$ 0,05 – 0,07 |
| Speech-to-Text (alinhamento, ~3 min) | ~US$ 0,05 |
| **Total Gemini (padrão)** | **~US$ 0,10 – 0,12 / história** |
| Neural2 (alternativa, com timepoints nativos) | ~US$ 0,05 (dentro da cota grátis de 1M chars) |

Valores aproximados; monitorize no [Cloud Billing](https://console.cloud.google.com/billing).

## Referências

- [Gemini-TTS](https://cloud.google.com/text-to-speech/docs/gemini-tts)
- [Preços Text-to-Speech](https://cloud.google.com/text-to-speech/pricing?hl=pt-BR)
- [Preços Speech-to-Text](https://cloud.google.com/speech-to-text/pricing?hl=pt-BR)
- [API v1 text:synthesize](https://cloud.google.com/text-to-speech/docs/reference/rest/v1/text/synthesize)
- [Speech-to-Text word time offsets](https://cloud.google.com/speech-to-text/docs/samples/speech-transcribe-word-time-offsets-v2)
