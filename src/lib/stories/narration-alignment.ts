import type { NarrationAlignment } from '@/lib/domain/schemas';
import type { StoryNarrationPageRange } from '@/lib/stories/page-plain-text';

export type NarrationWordTiming = {
  text: string;
  start: number;
  end: number;
  charStart: number;
  charEnd: number;
};

export type PageNarrationSlice = {
  pageIndex: number;
  alignment: NarrationAlignment;
  startSeconds: number;
  endSeconds: number;
};

export function alignmentToWords(alignment: NarrationAlignment): NarrationWordTiming[] {
  const words: NarrationWordTiming[] = [];
  let current = '';
  let wordStart = 0;
  let wordStartTime = alignment.characterStartTimesSeconds[0] ?? 0;
  let charIndex = 0;

  const flush = (endIndex: number, endTime: number) => {
    const text = current.trim();
    if (text) {
      words.push({
        text,
        start: wordStartTime,
        end: endTime,
        charStart: wordStart,
        charEnd: endIndex,
      });
    }
    current = '';
    wordStart = endIndex + 1;
  };

  for (let i = 0; i < alignment.characters.length; i++) {
    const char = alignment.characters[i] ?? '';
    const start = alignment.characterStartTimesSeconds[i] ?? 0;
    const end = alignment.characterEndTimesSeconds[i] ?? start;

    if (!current) {
      wordStart = charIndex;
      wordStartTime = start;
    }

    if (/\s/.test(char)) {
      flush(charIndex, end);
    } else {
      current += char;
    }

    charIndex += char.length;
  }

  if (current.trim()) {
    const lastEnd =
      alignment.characterEndTimesSeconds[alignment.characterEndTimesSeconds.length - 1] ?? 0;
    flush(charIndex - 1, lastEnd);
  }

  return words;
}

export function findActiveWordIndex(words: NarrationWordTiming[], currentTime: number): number {
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (currentTime >= word.start && currentTime < word.end) {
      return i;
    }
  }

  if (words.length > 0 && currentTime >= words[words.length - 1].end) {
    return words.length - 1;
  }

  return -1;
}

export function sliceAlignmentByCharRange(
  alignment: NarrationAlignment,
  charStart: number,
  charEnd: number
): { alignment: NarrationAlignment; startSeconds: number; endSeconds: number } | null {
  let cursor = 0;
  let from = -1;
  let to = -1;

  for (let i = 0; i < alignment.characters.length; i++) {
    const char = alignment.characters[i] ?? '';
    const next = cursor + char.length;
    if (next > charStart && cursor < charEnd) {
      if (from === -1) from = i;
      to = i;
    }
    cursor = next;
  }

  if (from === -1 || to === -1) return null;

  const sliced: NarrationAlignment = {
    characters: alignment.characters.slice(from, to + 1),
    characterStartTimesSeconds: alignment.characterStartTimesSeconds.slice(from, to + 1),
    characterEndTimesSeconds: alignment.characterEndTimesSeconds.slice(from, to + 1),
  };

  return {
    alignment: sliced,
    startSeconds: sliced.characterStartTimesSeconds[0] ?? 0,
    endSeconds:
      sliced.characterEndTimesSeconds[sliced.characterEndTimesSeconds.length - 1] ??
      sliced.characterStartTimesSeconds[0] ??
      0,
  };
}

export function sliceStoryAlignment(
  alignment: NarrationAlignment,
  pages: StoryNarrationPageRange[]
): PageNarrationSlice[] {
  const slices: PageNarrationSlice[] = [];

  for (const page of pages) {
    const sliced = sliceAlignmentByCharRange(alignment, page.charStart, page.charEnd);
    if (!sliced) continue;
    slices.push({
      pageIndex: page.pageIndex,
      alignment: sliced.alignment,
      startSeconds: sliced.startSeconds,
      endSeconds: sliced.endSeconds,
    });
  }

  for (let i = 0; i < slices.length - 1; i++) {
    const current = slices[i];
    const next = slices[i + 1];
    if (current && next && current.endSeconds < next.startSeconds) {
      current.endSeconds = next.startSeconds;
    }
  }

  return slices;
}
