import { describe, expect, it, vi } from 'vitest';
import { FRIENDLY_GENERATION_ERROR, LlmValidationError } from '@/lib/domain/errors';
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

describe('parseStoryGenerationResponse — robustness', () => {
  function story(overrides: Record<string, unknown> = {}) {
    return {
      metadata: { livro: 'Mateus', capitulo: 14, versiculo: '24-27', idade_alvo: 5 },
      conteudo_estruturado: [
        { tipo: 'texto', conteudo: 'Os amigos estavam no barco.' },
        { tipo: 'interativo', rotulo: 'Ouvir o vento', texto_para_audio: 'Fuuuu!', tag_som: 'vento_mar' },
        { tipo: 'texto', conteudo: 'Jesus acalmou o mar.' },
      ],
      quiz: SAMPLE_QUIZ,
      ...overrides,
    };
  }

  it('accepts null correctOptionId on reflection questions (strict structured outputs)', () => {
    const quiz = {
      ...SAMPLE_QUIZ,
      questions: SAMPLE_QUIZ.questions.map((q) =>
        q.type === 'reflection' ? { ...q, correctOptionId: null } : q
      ),
    };
    const result = parseStoryGenerationResponse(JSON.stringify(story({ quiz })));
    expect(result.quiz?.questions).toHaveLength(2);
    expect(result.quiz?.questions[1]).not.toHaveProperty('correctOptionId');
  });

  it('keeps the story but drops an invalid quiz instead of failing the whole generation', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = parseStoryGenerationResponse(JSON.stringify(story({ quiz: { perguntas: [] } })));
    expect(result.content.pages.length).toBeGreaterThan(0);
    expect(result.quiz).toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('fills a missing rotulo from label/titulo or texto_para_audio (json_object fallback)', () => {
    const blocks = [
      { tipo: 'texto', conteudo: 'Os amigos estavam no barco.' },
      { tipo: 'interativo', label: 'Ouvir o vento', texto_para_audio: 'Fuuuu!', tag_som: 'vento_mar' },
      { tipo: 'texto', conteudo: 'Jesus falou com eles.' },
      { tipo: 'interativo', texto_para_audio: 'Coragem, sou eu!', tag_som: 'fala_jesus' },
      { tipo: 'texto', conteudo: 'Jesus acalmou o mar.' },
    ];
    const result = parseStoryGenerationResponse(JSON.stringify(story({ conteudo_estruturado: blocks })));
    const interactive = result.content.pages
      .flatMap((p) => p.paragraphs.flat())
      .filter((part) => part.type === 'interactive');
    expect(interactive.map((p) => (p as { rotulo: string }).rotulo)).toEqual(['Ouvir o vento', 'Coragem, sou eu!']);
  });

  it('throws LlmValidationError with a friendly message and technical details kept separately', () => {
    try {
      parseStoryGenerationResponse(JSON.stringify({ metadata: {}, conteudo_estruturado: 'x' }));
      throw new Error('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(LlmValidationError);
      const err = error as LlmValidationError;
      expect(err.message).toBe(FRIENDLY_GENERATION_ERROR);
      expect(err.message).not.toMatch(/expected|received|conteudo_estruturado/);
      expect(err.details).toMatch(/conteudo_estruturado/);
    }
  });

  it('invalid JSON → friendly message, details mention JSON', () => {
    try {
      parseStoryGenerationResponse('{not json');
      throw new Error('should have thrown');
    } catch (error) {
      expect((error as LlmValidationError).message).toBe(FRIENDLY_GENERATION_ERROR);
      expect((error as LlmValidationError).details).toMatch(/JSON/);
    }
  });
});
