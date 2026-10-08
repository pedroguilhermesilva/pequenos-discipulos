import { describe, expect, it } from 'vitest';
import { mapPedagogicalStoryToContent } from '@/lib/llm/map-pedagogical-story';
import { buildLegacyPedagogicalStory, buildSamplePedagogicalStory } from '@/lib/llm/test-fixtures';

describe('mapPedagogicalStoryToContent', () => {
  it('embeds interactive words inline within text paragraphs', () => {
    const response = buildSamplePedagogicalStory({
      conteudo_estruturado: [
        {
          tipo: 'texto',
          conteudo: 'Os amigos estavam no barco. O vento soprava forte.',
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
          conteudo: 'Jesus disse: Coragem!',
          marcadores_interativos: [
            {
              palavra: 'Coragem',
              texto_para_audio: 'Coragem!',
              tag_som: 'fala_jesus_coragem',
            },
          ],
        },
      ],
    });

    const content = mapPedagogicalStoryToContent(response);
    const firstParagraph = content.pages[0]?.paragraphs[0] ?? [];

    expect(firstParagraph.map((part) => part.type)).toEqual(['text', 'word', 'text']);
    expect(firstParagraph[1]).toMatchObject({
      type: 'word',
      value: 'vento',
      tagSom: 'vento_tempestade_mar',
    });
    expect(content.pages[0]?.paragraphs[1]?.[1]).toMatchObject({
      type: 'word',
      value: 'Coragem',
      tagSom: 'fala_jesus_coragem',
    });
  });

  it('maps legacy interativo blocks for backward compatibility', () => {
    const content = mapPedagogicalStoryToContent(buildLegacyPedagogicalStory());

    expect(content.pages[0]?.paragraphs[0]?.map((part) => part.type)).toEqual([
      'text',
      'interactive',
      'text',
    ]);
  });
});
