import type { AdaptationContent, StoryTextPart } from '@/lib/domain/schemas';
import {
  capInteractionsPerPage,
  splitTextBlockWithMarkers,
} from '@/lib/llm/inline-interactive-markers';
import type { PedagogicalStoryResponse } from '@/lib/llm/pedagogical-story.schema';
import { isLegacyPedagogicalFormat } from '@/lib/llm/validate-pedagogical-story';

/** Blocos de texto por página do leitor. */
const TEXT_BLOCKS_PER_PAGE = 2;

function legacyBlockToPart(
  block: Extract<PedagogicalStoryResponse['conteudo_estruturado'][number], { tipo: 'interativo' }>
): StoryTextPart {
  return {
    type: 'interactive',
    rotulo: block.rotulo,
    textoParaAudio: block.texto_para_audio,
    tagSom: block.tag_som,
  };
}

function mapLegacyPedagogicalStory(response: PedagogicalStoryResponse): AdaptationContent {
  const parts: StoryTextPart[] = response.conteudo_estruturado.map((block) => {
    if (block.tipo === 'texto') {
      return { type: 'text', value: block.conteudo };
    }
    return legacyBlockToPart(block);
  });

  const pages = [];
  for (let index = 0; index < parts.length; index += 6) {
    pages.push({
      paragraphs: [parts.slice(index, index + 6)],
    });
  }

  return { pages: pages.length > 0 ? pages : [{ paragraphs: [[]] }] };
}

function mapInlinePedagogicalStory(response: PedagogicalStoryResponse): AdaptationContent {
  const textBlocks = response.conteudo_estruturado.filter((block) => block.tipo === 'texto');

  const pages = [];
  for (let index = 0; index < textBlocks.length; index += TEXT_BLOCKS_PER_PAGE) {
    const pageBlocks = textBlocks.slice(index, index + TEXT_BLOCKS_PER_PAGE);
    const paragraphs = pageBlocks.map((block) => {
      const parts = splitTextBlockWithMarkers(
        block.conteudo,
        block.marcadores_interativos ?? []
      );
      return capInteractionsPerPage(parts);
    });

    pages.push({ paragraphs });
  }

  return { pages: pages.length > 0 ? pages : [{ paragraphs: [[]] }] };
}

export function mapPedagogicalStoryToContent(
  response: PedagogicalStoryResponse
): AdaptationContent {
  if (isLegacyPedagogicalFormat(response.conteudo_estruturado)) {
    return mapLegacyPedagogicalStory(response);
  }
  return mapInlinePedagogicalStory(response);
}

export function buildTitleFromPedagogicalMetadata(
  metadata: PedagogicalStoryResponse['metadata']
): string {
  return `${metadata.livro} ${metadata.capitulo}:${metadata.versiculo}`;
}

export function countInteractiveMoments(response: PedagogicalStoryResponse): number {
  if (isLegacyPedagogicalFormat(response.conteudo_estruturado)) {
    return response.conteudo_estruturado.filter((block) => block.tipo === 'interativo').length;
  }

  return response.conteudo_estruturado
    .filter((block) => block.tipo === 'texto')
    .reduce((total, block) => total + (block.marcadores_interativos?.length ?? 0), 0);
}

export function buildAdaptationNoteFromPedagogical(
  response: PedagogicalStoryResponse
): string {
  const { metadata } = response;
  const interactiveCount = countInteractiveMoments(response);
  return `Adaptado para ${metadata.idade_alvo} anos (${metadata.livro} ${metadata.capitulo}:${metadata.versiculo}) com ${interactiveCount} momento(s) sonoro(s) interativo(s).`;
}
