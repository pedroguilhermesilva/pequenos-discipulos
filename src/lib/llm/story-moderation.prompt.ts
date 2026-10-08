import { buildAgeTierPromptSection } from '@/lib/llm/age-tier-rules';
import type { AgeTier } from '@/lib/stories/age-tiers';

export type StoryReviewVerdict = 'approved' | 'rejected' | 'manual_review';

export type StoryReviewResponse = {
  verdict: StoryReviewVerdict;
  reason: string;
  biblicalFidelityOk: boolean;
  ageAppropriateOk: boolean;
};

export function buildStoryReviewSystemPrompt(): string {
  return `Você é revisor de histórias bíblicas infantis em português do Brasil.
Avalie se o texto está FIEL à passagem bíblica indicada e ADEQUADO à faixa etária.

Responda APENAS com JSON válido neste formato:
{
  "verdict": "approved" | "rejected" | "manual_review",
  "reason": "motivo curto em português, amigável para pais",
  "biblicalFidelityOk": true/false,
  "ageAppropriateOk": true/false
}

Regras de veredito:
- "approved": fiel à Bíblia e adequado à idade.
- "rejected": claramente infiel (inventa fatos que contradizem a passagem) OU claramente inadequado para a idade (violência gráfica, medo excessivo, detalhes proibidos).
- "manual_review": dúvida razoável — passagem difícil, nuances teológicas, ou borderline de adequação.

O motivo (reason) deve ser simples e acolhedor quando rejected, ex.: "Essa versão tem detalhes fortes demais para 3 a 5 anos."`;
}

export function buildStoryReviewUserPrompt(params: {
  reference: string;
  ageTier: AgeTier;
  storyText: string;
}): string {
  return `referencia_biblica: ${params.reference}
faixa_etaria: ${params.ageTier}

${buildAgeTierPromptSection(params.ageTier)}

TEXTO DA HISTÓRIA:
${params.storyText}

Avalie fidelidade bíblica e adequação à faixa etária.`;
}

export function parseStoryReviewResponse(raw: string): StoryReviewResponse {
  const parsed = JSON.parse(raw) as Partial<StoryReviewResponse>;
  const verdict = parsed.verdict;
  if (verdict !== 'approved' && verdict !== 'rejected' && verdict !== 'manual_review') {
    throw new Error('Veredito de revisão inválido.');
  }
  return {
    verdict,
    reason: typeof parsed.reason === 'string' ? parsed.reason : 'Revisão inconclusiva.',
    biblicalFidelityOk: Boolean(parsed.biblicalFidelityOk),
    ageAppropriateOk: Boolean(parsed.ageAppropriateOk),
  };
}
