import { LlmValidationError } from '@/lib/domain/errors';
import type { PedagogicalStoryResponse } from '@/lib/llm/pedagogical-story.schema';

function maxWordsPerTextBlock(idadeAlvo: number): number {
  if (idadeAlvo <= 5) return 45;
  if (idadeAlvo <= 8) return 90;
  return 140;
}

export function isLegacyPedagogicalFormat(blocks: PedagogicalStoryResponse['conteudo_estruturado']): boolean {
  return blocks.some((block) => block.tipo === 'interativo');
}

/** Valida estrutura básica da história (sem alternância texto/interativo). */
export function assertPedagogicalStructure(response: PedagogicalStoryResponse): void {
  const blocks = response.conteudo_estruturado;
  const textoBlocks = blocks.filter((block) => block.tipo === 'texto');

  if (textoBlocks.length < 1) {
    throw new LlmValidationError('conteudo_estruturado deve conter pelo menos um bloco "texto".');
  }

  const maxWords = maxWordsPerTextBlock(response.metadata.idade_alvo);

  for (const block of textoBlocks) {
    const wordCount = block.conteudo.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > maxWords) {
      throw new LlmValidationError(
        `Bloco "texto" muito longo (${wordCount} palavras). Divida a narrativa em blocos menores.`
      );
    }
  }
}
