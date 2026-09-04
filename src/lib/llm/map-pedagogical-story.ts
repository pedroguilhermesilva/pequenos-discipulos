import type { AdaptationContent, StoryTextPart } from '@/lib/domain/schemas';
import type { PedagogicalStoryResponse } from '@/lib/llm/pedagogical-story.schema';

/** Max structured blocks per viewer page — keeps interleaved audio in reading flow. */
const BLOCKS_PER_PAGE = 6;

function blockToPart(
  block: PedagogicalStoryResponse['conteudo_estruturado'][number]
): StoryTextPart {
  if (block.tipo === 'texto') {
    return { type: 'text', value: block.conteudo };
  }

  return {
    type: 'interactive',
    rotulo: block.rotulo,
    textoParaAudio: block.texto_para_audio,
    tagSom: block.tag_som,
  };
}

export function mapPedagogicalStoryToContent(
  response: PedagogicalStoryResponse
): AdaptationContent {
  const parts = response.conteudo_estruturado.map(blockToPart);

  const pages = [];
  for (let index = 0; index < parts.length; index += BLOCKS_PER_PAGE) {
    pages.push({
      paragraphs: [parts.slice(index, index + BLOCKS_PER_PAGE)],
    });
  }

  return { pages: pages.length > 0 ? pages : [{ paragraphs: [[]] }] };
}

export function buildTitleFromPedagogicalMetadata(
  metadata: PedagogicalStoryResponse['metadata']
): string {
  return `${metadata.livro} ${metadata.capitulo}:${metadata.versiculo}`;
}

export function buildAdaptationNoteFromPedagogical(
  response: PedagogicalStoryResponse
): string {
  const { metadata, conteudo_estruturado } = response;
  const interactiveCount = conteudo_estruturado.filter((b) => b.tipo === 'interativo').length;
  return `Adaptado para ${metadata.idade_alvo} anos (${metadata.livro} ${metadata.capitulo}:${metadata.versiculo}) com ${interactiveCount} momento(s) sonoro(s) interativo(s).`;
}
