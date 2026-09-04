import type { AdaptationContent } from '@/lib/domain/schemas';
import { isSpeechSoundTag } from '@/lib/stories/sound-tag';

export type StoryNarrationPageRange = {
  pageIndex: number;
  text: string;
  charStart: number;
  charEnd: number;
};

export type StoryNarrationText = {
  fullText: string;
  pages: StoryNarrationPageRange[];
};

function joinSpokenParts(parts: string[]): string {
  let result = '';

  for (const raw of parts) {
    const collapsed = raw.replace(/\s+/g, ' ');
    const trimmed = collapsed.trim();
    if (!trimmed) continue;

    if (!result) {
      result = trimmed;
      continue;
    }

    if (/^[.,;:!?…]/.test(trimmed)) {
      result += trimmed;
      continue;
    }

    result += ` ${trimmed}`;
  }

  return result.replace(/\s+/g, ' ').trim();
}

function spokenFragmentsFromPart(
  part: AdaptationContent['pages'][number]['paragraphs'][number][number]
): string[] {
  if (part.type === 'text' || part.type === 'em' || part.type === 'word') {
    return [part.value];
  }

  if (part.type === 'audio-pill') {
    return part.variant === 'narracao' ? [part.label] : [];
  }

  if (part.type === 'interactive' && isSpeechSoundTag(part.tagSom)) {
    return [part.textoParaAudio || part.rotulo];
  }

  return [];
}

export function extractPagePlainText(
  content: AdaptationContent,
  pageIndex: number
): string {
  const page = content.pages[pageIndex];
  if (!page) return '';

  const paragraphs = page.paragraphs.map((paragraph) => {
    const fragments = paragraph.flatMap(spokenFragmentsFromPart);
    return joinSpokenParts(fragments);
  });

  return paragraphs.filter(Boolean).join(' ').trim();
}

export function extractStoryNarrationText(content: AdaptationContent): StoryNarrationText {
  const pages: StoryNarrationPageRange[] = [];
  let cursor = 0;
  let fullText = '';

  for (let pageIndex = 0; pageIndex < content.pages.length; pageIndex++) {
    const text = extractPagePlainText(content, pageIndex);
    if (!text) continue;

    if (fullText) {
      fullText += ' ';
      cursor += 1;
    }

    const charStart = cursor;
    fullText += text;
    cursor += text.length;
    pages.push({ pageIndex, text, charStart, charEnd: cursor });
  }

  return { fullText, pages };
}
