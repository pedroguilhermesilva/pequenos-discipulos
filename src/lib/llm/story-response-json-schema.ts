/**
 * JSON Schema para OpenAI Structured Outputs (`response_format: json_schema`, `strict: true`).
 *
 * Mantido à mão em sincronia com `pedagogicalStoryResponseSchema` (Zod) — o teste
 * `story-response-json-schema.test.ts` falha se as chaves divergirem.
 *
 * Regras do modo strict: todos os campos em `required`, `additionalProperties: false`;
 * campos opcionais usam tipo `["string", "null"]` (o parser converte null → ausente).
 */

const string = (description?: string) => ({ type: 'string', ...(description ? { description } : {}) });

const metadata = {
  type: 'object',
  properties: {
    livro: string('Nome do livro bíblico, ex.: "Mateus"'),
    capitulo: { type: 'integer', description: 'Número do capítulo' },
    versiculo: string('Intervalo de versículos, ex.: "1-10"'),
    idade_alvo: { type: 'integer', description: 'Idade alvo entre 3 e 11' },
  },
  required: ['livro', 'capitulo', 'versiculo', 'idade_alvo'],
  additionalProperties: false,
};

const textBlock = {
  type: 'object',
  properties: {
    tipo: { type: 'string', enum: ['texto'] },
    conteudo: string('2 a 4 frases curtas da narrativa'),
  },
  required: ['tipo', 'conteudo'],
  additionalProperties: false,
};

const interactiveBlock = {
  type: 'object',
  properties: {
    tipo: { type: 'string', enum: ['interativo'] },
    rotulo: string('Texto curto do botão de áudio, ex.: "Ouvir o vento"'),
    texto_para_audio: string('Fala ou onomatopeia a tocar'),
    tag_som: string('minúsculas, sem acentos, com underscores, ex.: vento_tempestade_mar'),
  },
  required: ['tipo', 'rotulo', 'texto_para_audio', 'tag_som'],
  additionalProperties: false,
};

const quizOption = {
  type: 'object',
  properties: {
    id: string(),
    label: string(),
    icon: string('Nome de ícone Material Symbols, ex.: "sailing"'),
  },
  required: ['id', 'label', 'icon'],
  additionalProperties: false,
};

const quizQuestion = {
  type: 'object',
  properties: {
    id: string(),
    type: { type: 'string', enum: ['choice', 'reflection'] },
    prompt: string('Pergunta para a criança'),
    options: { type: 'array', description: 'Exatamente 3 opções', items: quizOption },
    correctOptionId: {
      type: ['string', 'null'],
      description: 'id da opção certa em perguntas "choice"; null em "reflection"',
    },
    encouragementCorrect: string(),
    encouragementAlmost: string(),
  },
  required: [
    'id',
    'type',
    'prompt',
    'options',
    'correctOptionId',
    'encouragementCorrect',
    'encouragementAlmost',
  ],
  additionalProperties: false,
};

const quiz = {
  type: 'object',
  properties: {
    title: string('Título do quiz, ex.: "Vamos relembrar?"'),
    subtitle: string(),
    celebrationTitle: string('Título ao terminar, ex.: "Você brilhou!"'),
    celebrationMessage: string(),
    questions: { type: 'array', description: '2 a 3 perguntas', items: quizQuestion },
  },
  required: ['title', 'subtitle', 'celebrationTitle', 'celebrationMessage', 'questions'],
  additionalProperties: false,
};

export const STORY_RESPONSE_SCHEMA_NAME = 'historia_pedagogica';

export const STORY_RESPONSE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    metadata,
    conteudo_estruturado: {
      type: 'array',
      description: 'Alterna blocos "texto" e "interativo"; começa e termina com "texto"',
      items: { anyOf: [textBlock, interactiveBlock] },
    },
    quiz,
  },
  required: ['metadata', 'conteudo_estruturado', 'quiz'],
  additionalProperties: false,
} as const;

/** Exemplo concreto do formato, usado no prompt (útil sobretudo no modo json_object). */
export const STORY_RESPONSE_EXAMPLE = {
  metadata: { livro: 'Mateus', capitulo: 14, versiculo: '24-27', idade_alvo: 4 },
  conteudo_estruturado: [
    { tipo: 'texto', conteudo: 'Os amigos de Jesus estavam no barco. O vento soprava forte.' },
    {
      tipo: 'interativo',
      rotulo: 'Ouvir o vento',
      texto_para_audio: 'Fuuuuu! Fuuuuu!',
      tag_som: 'vento_tempestade_mar',
    },
    { tipo: 'texto', conteudo: 'Jesus veio andando sobre a água. Ele disse: "Coragem!"' },
  ],
  quiz: {
    title: 'Vamos relembrar?',
    subtitle: 'Toque na resposta que você lembra.',
    celebrationTitle: 'Você brilhou!',
    celebrationMessage: 'Jesus está sempre com a gente!',
    questions: [
      {
        id: 'q1',
        type: 'choice',
        prompt: 'Onde estavam os amigos de Jesus?',
        options: [
          { id: 'barco', label: 'No barco', icon: 'sailing' },
          { id: 'monte', label: 'No monte', icon: 'landscape' },
          { id: 'casa', label: 'Em casa', icon: 'home' },
        ],
        correctOptionId: 'barco',
        encouragementCorrect: 'Isso! Eles estavam no barco.',
        encouragementAlmost: 'Quase! Eles estavam no barco.',
      },
      {
        id: 'q2',
        type: 'reflection',
        prompt: 'Como você se sente sabendo que Jesus cuida de você?',
        options: [
          { id: 'feliz', label: 'Feliz', icon: 'sentiment_very_satisfied' },
          { id: 'calmo', label: 'Calminho', icon: 'sentiment_satisfied' },
          { id: 'amado', label: 'Amado', icon: 'favorite' },
        ],
        correctOptionId: null,
        encouragementCorrect: 'Que lindo! Guarde isso no coração.',
        encouragementAlmost: 'Que lindo! Guarde isso no coração.',
      },
    ],
  },
};
