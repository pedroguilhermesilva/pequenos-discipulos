import { LlmValidationError } from '@/lib/domain/errors';
import type { PedagogicalStoryResponse } from '@/lib/llm/pedagogical-story.schema';

function maxWordsPerTextBlock(idadeAlvo: number): number {
  if (idadeAlvo <= 5) return 45;
  if (idadeAlvo <= 8) return 90;
  return 140;
}

export function assertPedagogicalStructure(response: PedagogicalStoryResponse): void {
  const blocks = response.conteudo_estruturado;
  const textoBlocks = blocks.filter((block) => block.tipo === 'texto');
  const interactiveBlocks = blocks.filter((block) => block.tipo === 'interativo');

  if (blocks[0]?.tipo !== 'texto') {
    throw new LlmValidationError('conteudo_estruturado deve começar com um bloco "texto".');
  }

  if (blocks.at(-1)?.tipo === 'interativo') {
    throw new LlmValidationError('A história deve terminar com um bloco "texto".');
  }

  if (interactiveBlocks.length < 1) {
    throw new LlmValidationError('Inclua pelo menos 1 bloco "interativo".');
  }

  if (textoBlocks.length < interactiveBlocks.length + 1) {
    throw new LlmValidationError(
      'Divida a história em blocos "texto" menores, com momentos "interativo" entre eles.'
    );
  }

  const maxWords = maxWordsPerTextBlock(response.metadata.idade_alvo);

  for (const block of textoBlocks) {
    const wordCount = block.conteudo.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > maxWords) {
      throw new LlmValidationError(
        `Bloco "texto" muito longo (${wordCount} palavras). Intercale áudios no meio da narrativa.`
      );
    }
  }

  for (let index = 1; index < blocks.length; index += 1) {
    const previous = blocks[index - 1];
    const current = blocks[index];
    if (previous.tipo === current.tipo) {
      throw new LlmValidationError(
        'Não coloque dois blocos do mesmo tipo seguidos. Alterne "texto" e "interativo".'
      );
    }
  }
}
