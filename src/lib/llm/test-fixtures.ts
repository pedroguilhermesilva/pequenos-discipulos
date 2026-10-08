import type { PedagogicalStoryResponse } from '@/lib/llm/pedagogical-story.schema';

export const samplePedagogicalQuiz = {
  title: 'Vamos relembrar?',
  subtitle: 'Escolha a resposta certa.',
  celebrationTitle: 'Muito bem!',
  celebrationMessage: 'Deus cuida de nós.',
  questions: [
    {
      id: 'q1',
      type: 'choice' as const,
      prompt: 'Quem guiou os amigos?',
      options: [
        { id: 'star', label: 'A estrela', icon: 'star' },
        { id: 'moon', label: 'A lua', icon: 'nightlight' },
        { id: 'cloud', label: 'Nuvem', icon: 'cloud' },
      ],
      correctOptionId: 'star',
      encouragementCorrect: 'Isso!',
      encouragementAlmost: 'Quase!',
    },
  ],
};

export function buildSamplePedagogicalStory(
  overrides: Partial<PedagogicalStoryResponse> = {}
): PedagogicalStoryResponse {
  return {
    metadata: {
      livro: 'Mateus',
      capitulo: 14,
      versiculo: '24-27',
      idade_alvo: 5,
    },
    conteudo_estruturado: [
      {
        tipo: 'texto',
        conteudo: 'Os amigos de Jesus estavam no barco. O vento soprava forte.',
        marcadores_interativos: [
          {
            palavra: 'vento',
            texto_para_audio: 'Fwoooosh!',
            tag_som: 'vento_tempestade_mar',
          },
        ],
      },
      {
        tipo: 'texto',
        conteudo: 'Jesus disse para não terem medo.',
        marcadores_interativos: [],
      },
    ],
    quiz: samplePedagogicalQuiz,
    ...overrides,
  };
}

/** Formato legado com blocos interativos separados (compatibilidade). */
export function buildLegacyPedagogicalStory(
  overrides: Partial<PedagogicalStoryResponse> = {}
): PedagogicalStoryResponse {
  return {
    metadata: {
      livro: 'Mateus',
      capitulo: 14,
      versiculo: '24-27',
      idade_alvo: 5,
    },
    conteudo_estruturado: [
      { tipo: 'texto', conteudo: 'Trecho 1.', marcadores_interativos: [] },
      {
        tipo: 'interativo',
        rotulo: 'Ouvir a tempestade',
        texto_para_audio: 'Fwoooosh!',
        tag_som: 'vento_tempestade_mar',
      },
      { tipo: 'texto', conteudo: 'Trecho 2.', marcadores_interativos: [] },
    ],
    quiz: samplePedagogicalQuiz,
    ...overrides,
  };
}
