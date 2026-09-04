import { describe, expect, it } from 'vitest';
import { mapPedagogicalStoryToContent } from '@/lib/llm/map-pedagogical-story';
import type { PedagogicalStoryResponse } from '@/lib/llm/pedagogical-story.schema';

describe('mapPedagogicalStoryToContent', () => {
  it('keeps interleaved blocks in reading order on the same page', () => {
    const response: PedagogicalStoryResponse = {
      metadata: {
        livro: 'Mateus',
        capitulo: 14,
        versiculo: '24-27',
        idade_alvo: 5,
      },
      conteudo_estruturado: [
        { tipo: 'texto', conteudo: 'Trecho 1.' },
        {
          tipo: 'interativo',
          rotulo: 'Ouvir a tempestade',
          texto_para_audio: 'Fwoooosh!',
          tag_som: 'vento_tempestade_mar',
        },
        { tipo: 'texto', conteudo: 'Trecho 2.' },
        {
          tipo: 'interativo',
          rotulo: 'Ouvir Jesus',
          texto_para_audio: 'Coragem!',
          tag_som: 'fala_jesus_coragem',
        },
      ],
    };

    const content = mapPedagogicalStoryToContent(response);

    expect(content.pages).toHaveLength(1);
    expect(content.pages[0]?.paragraphs[0]?.map((part) => part.type)).toEqual([
      'text',
      'interactive',
      'text',
      'interactive',
    ]);
  });
});
