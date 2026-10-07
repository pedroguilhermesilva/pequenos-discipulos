# Comparativo de vozes pt-BR — Google Cloud Text-to-Speech

Pesquisa com base na [documentação oficial de preços](https://cloud.google.com/text-to-speech/pricing?hl=pt-BR), [vozes compatíveis](https://cloud.google.com/text-to-speech/docs/voices?hl=pt-br), [SSML / timepoints](https://cloud.google.com/text-to-speech/docs/ssml) e [Chirp 3 HD](https://cloud.google.com/text-to-speech/docs/chirp3-hd?hl=pt) (outubro de 2026).

## Resumo executivo

| Família | Preço (após cota grátis) | Cota grátis/mês | Qualidade (narração infantil) | SSML `<mark>` + timepoints |
|---------|--------------------------|-----------------|-------------------------------|----------------------------|
| **Standard** | US$ 4 / 1M caracteres | 4M | Robótica; legado | **Sim** (v1beta1, `SSML_MARK`) |
| **WaveNet** | US$ 4 / 1M caracteres | 4M | Boa, natural para histórias | **Sim** |
| **Neural2** | US$ 16 / 1M caracteres | 1M | Muito boa, tom narrativo | **Sim** |
| **Chirp 3: HD** | US$ 30 / 1M caracteres | 1M | Excelente, conversacional | **Não** — SSML limitado; `<mark>` não está na lista de tags suportadas |
| **Studio** | US$ 160 / 1M caracteres | 100K | Premium / mídia | SSML parcial; não indicado para `<mark>` em produção |

> **Requisito do Pequenos Discípulos:** leitura acompanhada palavra a palavra exige timepoints via `<mark name="…"/>` + `enableTimePointing: ["SSML_MARK"]` na API REST **v1beta1** `text:synthesize`. Só Standard, WaveNet e Neural2 são candidatas seguras.

## Detalhes por família

### Standard (`pt-BR-Standard-A` … `E`)

- **Preço:** US$ 0,000004/caractere → **US$ 4 / milhão** ([pricing](https://cloud.google.com/text-to-speech/pricing?hl=pt-BR)).
- **Qualidade:** voz sintética clássica; aceitável para protótipo, inferior a WaveNet/Neural2 para crianças.
- **Timepoints:** suportados via SSML `<mark>` + `enableTimePointing: ["SSML_MARK"]` ([referência v1beta1](https://cloud.google.com/text-to-speech/docs/reference/rest/v1beta1/text/synthesize)).

### WaveNet (`pt-BR-Wavenet-A` … `E`)

- **Preço:** **US$ 4 / milhão** (mesmo tier que Standard).
- **Qualidade:** mais calor humano que Standard; boa relação custo/qualidade para narração de histórias bíblicas infantis.
- **Timepoints:** **Sim**, mesmo mecanismo SSML `<mark>`.

### Neural2 (`pt-BR-Neural2-A`, `B`, `C`)

- **Preço:** US$ 0,000016/caractere → **US$ 16 / milhão**.
- **Qualidade:** melhor prosódia e entonação; ideal quando o orçamento permite um tom mais “contador de histórias”.
- **Timepoints:** **Sim**.

### Chirp 3: HD (`pt-BR-Chirp3-HD-*`, ~30 vozes)

- **Preço:** US$ 0,00003/caractere → **US$ 30 / milhão**.
- **Qualidade:** a mais natural e expressiva; pensada para agentes e mídia premium.
- **Timepoints:** **Não recomendado.** A documentação Chirp 3 HD lista tags SSML suportadas (`speak`, `break`, `prosody`, etc.) e **não inclui `<mark>`**; tags ignoradas não geram timepoints ([Chirp 3 HD SSML](https://cloud.google.com/text-to-speech/docs/chirp3-hd?hl=pt)).

## Recomendação para o app

**Voz padrão:** `pt-BR-Neural2-C` (feminina)

Escolhida após teste de narração: WaveNet soou robótica; Neural2 entrega tom mais narrativo e natural para histórias infantis.

Confirmação na documentação oficial:

- **Existência:** listada em [Vozes e idiomas compatíveis](https://cloud.google.com/text-to-speech/docs/voices?hl=pt-br) como `pt-BR-Neural2-C` (Premium, feminina).
- **SSML `<mark>` + timepoints:** Neural2 tem controlabilidade SSML; timepoints via `<mark>` + `enableTimePointing: ["SSML_MARK"]` na API v1beta1 ([SSML timepoints](https://cloud.google.com/text-to-speech/docs/ssml?hl=pt-br), [text:synthesize](https://cloud.google.com/text-to-speech/docs/reference/rest/v1beta1/text/synthesize)).

Outras Neural2 pt-BR femininas (`pt-BR-Neural2-A`, `C`) também suportam SSML; `C` foi a preferida no teste de escuta.

- **Preço:** US$ 16 / milhão (cota grátis 1M/mês).
- **Cache:** áudio gerado fica associado à voz (`story-narration@<voz>` no `AudioAsset` + campo `storyNarrationVoice` no conteúdo). Trocar a voz não reaproveita narração antiga.

**Alternativa económica:** `pt-BR-Wavenet-A` (US$ 4 / milhão) se o custo for prioritário.

Configure via env `GOOGLE_TTS_VOICE=pt-BR-Neural2-C`.

## Referências

- [Preços](https://cloud.google.com/text-to-speech/pricing?hl=pt-BR)
- [Vozes pt-BR](https://cloud.google.com/text-to-speech/docs/voices?hl=pt-br)
- [SSML timepoints](https://cloud.google.com/text-to-speech/docs/ssml)
- [API v1beta1 text:synthesize](https://cloud.google.com/text-to-speech/docs/reference/rest/v1beta1/text/synthesize)
