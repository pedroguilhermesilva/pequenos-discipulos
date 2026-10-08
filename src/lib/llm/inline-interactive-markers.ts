import type { PedagogicalInteractiveMarker } from '@/lib/llm/pedagogical-story.schema';
import type { StoryTextPart } from '@/lib/domain/schemas';
import { isKnownSoundTag, isSpeechSoundTag } from '@/lib/stories/sound-tag';

/** Máximo de palavras interativas por página do leitor. */
export const MAX_INTERACTIONS_PER_PAGE = 2;

function normalizeForMatch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

/** Localiza a primeira ocorrência de `palavra` em `texto` (ignora acentos e maiúsculas). */
export function findWordSpan(texto: string, palavra: string): { start: number; end: number } | null {
  const needle = normalizeForMatch(palavra.trim());
  if (!needle) return null;

  const normalizedText = normalizeForMatch(texto);
  const index = normalizedText.indexOf(needle);
  if (index === -1) return null;

  return { start: index, end: index + needle.length };
}

function isValidMarkerTag(tagSom: string): boolean {
  const tag = tagSom.trim().toLowerCase();
  if (!/^[a-z0-9_]+$/.test(tag)) return false;
  if (isSpeechSoundTag(tag)) return true;
  return isKnownSoundTag(tag);
}

export type SanitizedMarker = PedagogicalInteractiveMarker & {
  start: number;
  end: number;
};

/** Remove marcadores inválidos (palavra ausente, tag desconhecida, sobreposição). */
export function sanitizeInlineMarkers(
  conteudo: string,
  markers: PedagogicalInteractiveMarker[]
): SanitizedMarker[] {
  const accepted: SanitizedMarker[] = [];

  for (const marker of markers) {
    const span = findWordSpan(conteudo, marker.palavra);
    if (!span) continue;
    if (!isValidMarkerTag(marker.tag_som)) continue;

    const overlaps = accepted.some(
      (existing) => span.start < existing.end && span.end > existing.start
    );
    if (overlaps) continue;

    accepted.push({ ...marker, ...span });
  }

  return accepted.sort((a, b) => a.start - b.start);
}

/** Converte um bloco de texto + marcadores em partes inline (texto + word). */
export function splitTextBlockWithMarkers(
  conteudo: string,
  markers: PedagogicalInteractiveMarker[]
): StoryTextPart[] {
  const sanitized = sanitizeInlineMarkers(conteudo, markers);
  if (sanitized.length === 0) {
    return [{ type: 'text', value: conteudo }];
  }

  const parts: StoryTextPart[] = [];
  let cursor = 0;

  for (const marker of sanitized) {
    if (marker.start > cursor) {
      parts.push({ type: 'text', value: conteudo.slice(cursor, marker.start) });
    }

    const wordText = conteudo.slice(marker.start, marker.end);
    parts.push({
      type: 'word',
      value: wordText,
      tagSom: marker.tag_som,
      textoParaAudio: marker.texto_para_audio,
      ariaLabel: buildInlineWordAriaLabel(wordText, marker.tag_som),
    });

    cursor = marker.end;
  }

  if (cursor < conteudo.length) {
    parts.push({ type: 'text', value: conteudo.slice(cursor) });
  }

  return parts.length > 0 ? parts : [{ type: 'text', value: conteudo }];
}

export function buildInlineWordAriaLabel(palavra: string, tagSom: string): string {
  if (isSpeechSoundTag(tagSom)) {
    return `Ouvir fala: ${palavra}`;
  }
  return `Tocar som de ${palavra}`;
}

/** Limita marcadores interativos por página, descartando os excedentes. */
export function capInteractionsPerPage(parts: StoryTextPart[]): StoryTextPart[] {
  let count = 0;
  return parts.map((part) => {
    if (part.type !== 'word' || !part.tagSom) return part;
    count += 1;
    if (count <= MAX_INTERACTIONS_PER_PAGE) return part;
    return { type: 'text' as const, value: part.value };
  });
}
