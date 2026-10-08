import { describe, expect, it } from 'vitest';
import { LlmValidationError } from '@/lib/domain/errors';
import {
  assertPedagogicalStructure,
  isLegacyPedagogicalFormat,
} from '@/lib/llm/validate-pedagogical-story';
import { buildLegacyPedagogicalStory, buildSamplePedagogicalStory } from '@/lib/llm/test-fixtures';

describe('assertPedagogicalStructure', () => {
  it('accepts inline marker text blocks', () => {
    expect(() => assertPedagogicalStructure(buildSamplePedagogicalStory())).not.toThrow();
  });

  it('rejects stories with no text blocks', () => {
    expect(() =>
      assertPedagogicalStructure({
        ...buildSamplePedagogicalStory(),
        conteudo_estruturado: [
          {
            tipo: 'interativo',
            rotulo: 'Ouvir',
            texto_para_audio: 'Som',
            tag_som: 'vento_tempestade_mar',
          },
        ],
      })
    ).toThrow(LlmValidationError);
  });

  it('rejects a single text block that is too long for the age tier', () => {
    expect(() =>
      assertPedagogicalStructure({
        ...buildSamplePedagogicalStory(),
        metadata: { livro: 'Jonas', capitulo: 1, versiculo: '1-3', idade_alvo: 5 },
        conteudo_estruturado: [
          {
            tipo: 'texto',
            conteudo:
              'Papai do Céu falou com Jonas. Jonas fugiu para longe. O mar ficou bravo. A tempestade gritou muito alto. Jonas caiu na água fria. Um peixe grande o engoliu. Três dias e três noites ele ficou dentro. Depois ele saiu e foi obediente a Deus. Jonas contou a todos sobre o amor de Deus.',
            marcadores_interativos: [],
          },
        ],
      })
    ).toThrow(LlmValidationError);
  });
});

describe('isLegacyPedagogicalFormat', () => {
  it('detects legacy interativo blocks', () => {
    expect(isLegacyPedagogicalFormat(buildLegacyPedagogicalStory().conteudo_estruturado)).toBe(true);
    expect(isLegacyPedagogicalFormat(buildSamplePedagogicalStory().conteudo_estruturado)).toBe(false);
  });
});
