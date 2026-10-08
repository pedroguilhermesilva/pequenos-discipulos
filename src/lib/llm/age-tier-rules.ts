import type { AgeTier } from '@/lib/stories/age-tiers';

export type AgeTierRuleSet = {
  can: string[];
  cannot: string[];
  sensitiveExample: string;
};

export const AGE_TIER_RULES: Record<AgeTier, AgeTierRuleSet> = {
  '3-5': {
    can: [
      'Ideia central e o lado de amor e cuidado de Deus.',
      'Frases curtas (máx. 6 palavras por frase).',
      'Foco em sentimentos, cores e sons.',
    ],
    cannot: [
      'Nenhum detalhe de dor, sangue, morte de crianças ou castigo.',
      'Nada de medo como mensagem principal.',
      'Nenhuma descrição de violência ou sofrimento.',
    ],
    sensitiveExample:
      'Crucificação: "Jesus morreu por amor a nós e depois voltou à vida."',
  },
  '6-8': {
    can: [
      'Dizer que algo triste aconteceu (ex.: "Jesus foi preso e morreu na cruz").',
      'Narrativa linear com lições morais.',
      'Explicar conceitos difíceis de forma simples.',
    ],
    cannot: [
      'Descrever o sofrimento ou cenas violentas.',
      'Detalhes gráficos de dor, sangue ou castigo.',
      'Medo como tema central.',
    ],
    sensitiveExample:
      'Crucificação: "Jesus foi preso, morreu na cruz e, três dias depois, ressuscitou."',
  },
  '9-11': {
    can: [
      'Mais contexto histórico e emocional.',
      'Consequências das escolhas dos personagens.',
      'Termos teológicos com breve explicação.',
    ],
    cannot: [
      'Cenas gráficas ou descrições detalhadas de violência.',
      'Detalhes de tortura, sangue ou sofrimento físico.',
    ],
    sensitiveExample:
      'Crucificação: conta a prisão, o julgamento e a cruz com contexto, sem descrever a dor.',
  },
};

/** Passagens sensíveis usadas nos testes de moderação e geração. */
export const SENSITIVE_PASSAGE_REFERENCES = [
  'Mateus 2:16-18',
  'Gênesis 7:11-24',
  'Êxodo 7:14-12:30',
  '1 Samuel 17:1-51',
  'Juízes 16:1-30',
  'Mateus 27:32-56',
] as const;

export function buildAgeTierPromptSection(ageTier: AgeTier): string {
  const rules = AGE_TIER_RULES[ageTier];
  const label =
    ageTier === '3-5' ? '3 a 5 anos' : ageTier === '6-8' ? '6 a 8 anos' : '9 a 11 anos';

  return `## Regras para ${label}
**Pode:** ${rules.can.join(' ')}
**Não pode:** ${rules.cannot.join(' ')}
**Exemplo (passagem sensível):** ${rules.sensitiveExample}`;
}

export function buildAllAgeTierRulesPromptSection(): string {
  return (['3-5', '6-8', '9-11'] as AgeTier[])
    .map((tier) => buildAgeTierPromptSection(tier))
    .join('\n\n');
}
