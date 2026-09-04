import { describe, expect, it } from 'vitest';
import { parseStoryGenerationResponse } from '@/lib/llm/parse-story-response';

const SAMPLE_QUIZ = {
  title: 'Vamos relembrar juntos?',
  subtitle: 'Toque na resposta que você lembra da história.',
  celebrationTitle: 'Você brilhou!',
  celebrationMessage: 'Que o amor de Jesus traga paz ao seu coração!',
  questions: [
    {
      id: 'q1',
      type: 'choice' as const,
      prompt: 'Onde os amigos de Jesus estavam?',
      options: [
        { id: 'barco', label: 'No barco', icon: 'sailing' },
        { id: 'monte', label: 'No monte', icon: 'landscape' },
        { id: 'cidade', label: 'Na cidade', icon: 'location_city' },
      ],
      correctOptionId: 'barco',
      encouragementCorrect: 'Isso! Eles estavam no barco no meio do mar.',
      encouragementAlmost: 'Quase! Eles estavam no barco quando a tempestade veio.',
    },
    {
      id: 'q2',
      type: 'reflection' as const,
      prompt: 'Como você se sentiu com essa história?',
      options: [
        { id: 'alegre', label: 'Alegre', icon: 'sentiment_very_satisfied' },
        { id: 'calmo', label: 'Calminho', icon: 'sentiment_satisfied' },
        { id: 'amor', label: 'Cheio de amor', icon: 'favorite' },
      ],
      encouragementCorrect: 'Que lindo! Guarde esse sentimento no coração.',
      encouragementAlmost: 'Que lindo! Guarde esse sentimento no coração.',
    },
  ],
};

describe('parseStoryGenerationResponse', () => {
  it('parses pedagogical JSON into adaptation content', () => {
    const result = parseStoryGenerationResponse(
      JSON.stringify({
        metadata: {
          livro: 'Mateus',
          capitulo: 14,
          versiculo: '24-27',
          idade_alvo: 5,
        },
        conteudo_estruturado: [
          {
            tipo: 'texto',
            conteudo: 'Os amigos de Jesus estavam em um barco no mar.',
          },
          {
            tipo: 'interativo',
            rotulo: 'Ouvir a tempestade',
            texto_para_audio: 'O vento soprava bem alto: Fwoooosh!',
            tag_som: 'vento_tempestade_mar',
          },
          {
            tipo: 'texto',
            conteudo: 'Eles ficaram com medo, mas Jesus disse para ficarem calmos.',
          },
          {
            tipo: 'interativo',
            rotulo: 'Ouvir o que Jesus disse',
            texto_para_audio: 'Coragem! Sou eu. Não tenham medo!',
            tag_som: 'fala_jesus_coragem',
          },
          {
            tipo: 'texto',
            conteudo: 'Os discípulos ficaram em paz e seguiram Jesus com confiança.',
          },
        ],
        quiz: SAMPLE_QUIZ,
      })
    );

    expect(result.title).toBe('Mateus 14:24-27');
    expect(result.content.pages).toHaveLength(1);
    expect(result.content.pages[0]?.paragraphs[0]).toHaveLength(5);
    expect(result.content.pages[0]?.paragraphs[0]?.[1]).toMatchObject({
      type: 'interactive',
      rotulo: 'Ouvir a tempestade',
      tagSom: 'vento_tempestade_mar',
    });
    expect(result.quiz).toEqual(SAMPLE_QUIZ);
  });

  it('rejects stories that keep the entire narrative in one texto block', () => {
    expect(() =>
      parseStoryGenerationResponse(
        JSON.stringify({
          metadata: {
            livro: 'Jonas',
            capitulo: 1,
            versiculo: '1-3',
            idade_alvo: 5,
          },
          conteudo_estruturado: [
            {
              tipo: 'texto',
              conteudo:
                'Papai do Céu falou com Jonas. Jonas fugiu para Társis. O mar ficou bravo e a tempestade gritou muito alto.',
            },
            {
              tipo: 'interativo',
              rotulo: 'Ouça a tempestade',
              texto_para_audio: 'Uhul!',
              tag_som: 'tempestade_mar',
            },
          ],
          quiz: SAMPLE_QUIZ,
        })
      )
    ).toThrow();
  });
});
