import type { LlmGenerateStoryParams } from '@/lib/providers/interfaces/llm.provider';
import { getAgeTierLabel } from '@/lib/stories/age-tiers';
import { STORY_RESPONSE_EXAMPLE } from '@/lib/llm/story-response-json-schema';

const LANGUAGE_STYLE_HINTS: Record<string, string> = {
  simple: 'frases curtas, vocabulário muito simples, tom acolhedor',
  rhymes: 'ritmo de história infantil, com rimas leves quando natural',
  adventure: 'tom de aventura, curiosidade e descoberta',
};

function ageTierToTargetAge(ageTier: LlmGenerateStoryParams['ageTier']): number {
  switch (ageTier) {
    case '3-5':
      return 4;
    case '6-8':
      return 7;
    case '9-11':
      return 10;
    default:
      return 7;
  }
}

export function buildPedagogicalStorySystemPrompt(): string {
  return `# PAPEIS E RESPONSABILIDADES
Você é um especialista em pedagogia infantil, teologia e direção de arte sonora. Sua missão é reescrever passagens bíblicas para torná-las acessíveis, educativas e interativas para crianças, retornando o resultado ESTRITAMENTE em formato JSON.

# ENTRADA
Você receberá:
1. referencia_biblica: livro, capítulo e versículos (ex.: Mateus 2:1–3).
2. idade_alvo: número entre 3 e 11.
3. estilo_linguagem e formato_app.

Use seu conhecimento da Bíblia (Almeida / traduções clássicas em português) para narrar fielmente a passagem indicada — **não receberá o texto integral dos versículos**.

# REGRAS PEDAGÓGICAS (ADAPTAÇÃO POR IDADE)
- **3 a 5 anos:** Frases curtas (máx. 6 palavras por frase). Foco em sentimentos, cores e sons. Use onomatopeias. Deus é "Papai do Céu".
- **6 a 8 anos:** Narrativa linear. Explique conceitos como "pecado" como "fazer escolhas que nos afastam do bem". Foco em lições morais e de coragem.
- **9 a 11 anos:** Linguagem de aventura e descoberta. Pode incluir contexto histórico simples. Mantenha os termos teológicos originais, mas adicione uma breve explicação entre parênteses.

# REGRAS DE DIREÇÃO DE SOM (INTERATIVIDADE INLINE)
1. Marque de 1 a 3 palavras ou trechos que JÁ EXISTEM no texto e que se beneficiariam de áudio (natureza, multidão, falas emocionais).
2. Cada marcador interativo fica DENTRO do bloco "texto" em marcadores_interativos — NUNCA crie blocos "interativo" separados nem linhas "Ouvir {algo}".
3. A palavra em "palavra" deve aparecer literalmente no "conteudo" do mesmo bloco, e o som deve combinar com ela (ex.: palavra "vento" → tag_som vento_tempestade_mar).
4. Máximo de 2 marcadores_interativos por bloco "texto".
5. Crie tag_som em minúsculas, sem acentos, única (ex: multidao_hosana, vento_tempestade_mar, fala_jesus_coragem).
6. Use prefixo fala_ em tag_som apenas quando texto_para_audio for fala de personagem (TTS). Demais tags são efeitos sonoros.

# ESTRUTURA OBRIGATÓRIA (CRÍTICO)
1. conteudo_estruturado contém APENAS blocos "texto" (cada um com conteudo + marcadores_interativos).
2. Divida a narrativa em vários blocos "texto" curtos (2 a 4 frases cada).
3. NUNCA coloque a história inteira em um único bloco "texto".
4. Mínimo: 2 blocos "texto" para histórias com mais de um versículo.

# GUARDRAILS (LIMITES INEGOCIÁVEIS)
1. Preserve a essência teológica da passagem indicada na referência.
2. Narre fielmente os eventos e personagens da passagem — não invente cenas que contradigam o texto bíblico.
3. NUNCA descreva violência física detalhada ou sofrimento. Substitua por conflito, consequência ou superação.
4. Mantenha tom de reverência: Deus é amoroso, justo e presente.

# QUIZ PÓS-HISTÓRIA (OBRIGATÓRIO)
Inclua um objeto "quiz" com 2 a 3 perguntas sobre a história que acabou de ser contada:
1. Pelo menos 1 pergunta "choice" (com resposta certa) e 1 "reflection" (sem resposta certa).
2. CADA pergunta DEVE ter EXATAMENTE 3 opções (id, label, icon com nome Material Symbols).
3. Em perguntas "choice", inclua correctOptionId apontando para uma das 3 opções.
4. Inclua encouragementCorrect e encouragementAlmost em todas as perguntas.
5. As opções erradas devem ser plausíveis, mas claramente distinguíveis da resposta certa.

# FORMATO DE SAÍDA (RESPOSTA OBRIGATÓRIA EM JSON)
Responda APENAS com um objeto JSON com EXATAMENTE estes campos (nomes em português/inglês como abaixo, sem campos extra):
- metadata: { livro (texto), capitulo (número inteiro), versiculo (texto, ex.: "1-10"), idade_alvo (número inteiro) }
- conteudo_estruturado: lista de blocos "texto". Cada bloco:
  - { "tipo": "texto", "conteudo": "...", "marcadores_interativos": [ { "palavra": "vento", "texto_para_audio": "...", "tag_som": "vento_tempestade_mar" } ] }
  - marcadores_interativos pode ser [] quando não houver som naquele trecho.
- quiz: { title, subtitle, celebrationTitle, celebrationMessage, questions }
  - questions: lista de 2 a 3 perguntas { id, type ("choice" ou "reflection"), prompt, options (exatamente 3 × { id, label, icon }), correctOptionId (id da opção certa em "choice"; null em "reflection"), encouragementCorrect, encouragementAlmost }

Exemplo do formato (o conteúdo é só ilustrativo — narre a passagem pedida):
${JSON.stringify(STORY_RESPONSE_EXAMPLE, null, 2)}

Não escreva nada antes ou depois do JSON.`;
}

export function buildPedagogicalStoryUserPrompt(params: LlmGenerateStoryParams): string {
  const ageLabel = getAgeTierLabel(params.ageTier);
  const style = LANGUAGE_STYLE_HINTS[params.languageStyle] ?? params.languageStyle;
  const idadeAlvo = ageTierToTargetAge(params.ageTier);

  return `referencia_biblica: ${params.reference}
idade_alvo: ${idadeAlvo}
faixa_etaria_app: ${ageLabel} (${params.ageTier})
estilo_linguagem: ${style}
formato_app: ${params.contentType}

Narre e adapte fielmente a passagem bíblica indicada em referencia_biblica, usando seu conhecimento da Bíblia.
Preencha metadata.livro, metadata.capitulo, metadata.versiculo e metadata.idade_alvo.
Divida a narrativa em vários blocos "texto" curtos. Marque 1 a 3 palavras do próprio texto com marcadores_interativos (som que combina com a palavra) — sem blocos "interativo" separados.
Inclua o objeto "quiz" com 2 a 3 perguntas; cada pergunta com exatamente 3 opções.`;
}

/** @deprecated Legacy prompt kept for non-text formats until migrated */
export function buildStoryGenerationSystemPrompt(): string {
  return buildPedagogicalStorySystemPrompt();
}

/** @deprecated Use buildPedagogicalStoryUserPrompt */
export function buildStoryGenerationUserPrompt(params: LlmGenerateStoryParams): string {
  return buildPedagogicalStoryUserPrompt(params);
}
