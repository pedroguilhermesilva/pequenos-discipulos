import { describe, expect, it } from 'vitest';
import { LlmValidationError } from '@/lib/domain/errors';
import { assertPedagogicalStructure } from '@/lib/llm/validate-pedagogical-story';
import type { PedagogicalStoryResponse } from '@/lib/llm/pedagogical-story.schema';

const validStory: PedagogicalStoryResponse = {
  metadata: {
    livro: 'Mateus',
    capitulo: 14,
    versiculo: '24-27',
    idade_alvo: 5,
  },
  conteudo_estruturado: [
    { tipo: 'texto', conteudo: 'Os amigos de Jesus estavam em um barco.' },
    {
      tipo: 'interativo',
      rotulo: 'Ouvir a tempestade',
      texto_para_audio: 'Fwoooosh!',
      tag_som: 'vento_tempestade_mar',
    },
    { tipo: 'texto', conteudo: 'Jesus disse para não terem medo.' },
  ],
};

describe('assertPedagogicalStructure', () => {
  it('accepts alternating texto and interativo blocks', () => {
    expect(() => assertPedagogicalStructure(validStory)).not.toThrow();
  });

  it('rejects a single long texto block with one interativo at the end', () => {
    expect(() =>
      assertPedagogicalStructure({
        ...validStory,
        conteudo_estruturado: [
          {
            tipo: 'texto',
            conteudo:
              'Papai do Céu falou com Jonas. Jonas fugiu. O mar ficou bravo. A tempestade gritou. Jonas dentro do peixe ficou. Três dias e noites ele lá ficou.',
          },
          {
            tipo: 'interativo',
            rotulo: 'Ouça a tempestade',
            texto_para_audio: 'Uhul!',
            tag_som: 'tempestade_mar',
          },
        ],
      })
    ).toThrow(LlmValidationError);
  });

  it('rejects two blocks of the same type in a row', () => {
    expect(() =>
      assertPedagogicalStructure({
        ...validStory,
        conteudo_estruturado: [
          { tipo: 'texto', conteudo: 'Primeiro trecho.' },
          { tipo: 'texto', conteudo: 'Segundo trecho sem áudio no meio.' },
          {
            tipo: 'interativo',
            rotulo: 'Ouvir',
            texto_para_audio: 'Som',
            tag_som: 'som_teste',
          },
          { tipo: 'texto', conteudo: 'Final.' },
        ],
      })
    ).toThrow(LlmValidationError);
  });
});
