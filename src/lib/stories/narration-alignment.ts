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
  return alignment.words.map((text, index) => ({
    text,
    start: alignment.wordStartTimesSeconds[index] ?? 0,
    end: alignment.wordEndTimesSeconds[index] ?? 0,
    charStart: alignment.wordCharStarts[index] ?? 0,
    charEnd: alignment.wordCharEnds[index] ?? 0,
  }));
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

function sliceWordIndices(
  alignment: NarrationAlignment,
  charStart: number,
  charEnd: number
): number[] {
  const indices: number[] = [];

  for (let index = 0; index < alignment.words.length; index++) {
    const wordStart = alignment.wordCharStarts[index] ?? 0;
    const wordEnd = alignment.wordCharEnds[index] ?? 0;
    if (wordEnd > charStart && wordStart < charEnd) {
      indices.push(index);
    }
  }

  return indices;
}

export function sliceAlignmentByCharRange(
  alignment: NarrationAlignment,
  charStart: number,
  charEnd: number
): { alignment: NarrationAlignment; startSeconds: number; endSeconds: number } | null {
  const indices = sliceWordIndices(alignment, charStart, charEnd);
  if (indices.length === 0) return null;

  const from = indices[0];
  const to = indices[indices.length - 1];

  const sliced: NarrationAlignment = {
    words: alignment.words.slice(from, to + 1),
    wordStartTimesSeconds: alignment.wordStartTimesSeconds.slice(from, to + 1),
    wordEndTimesSeconds: alignment.wordEndTimesSeconds.slice(from, to + 1),
    wordCharStarts: alignment.wordCharStarts.slice(from, to + 1),
    wordCharEnds: alignment.wordCharEnds.slice(from, to + 1),
  };

  return {
    alignment: sliced,
    startSeconds: sliced.wordStartTimesSeconds[0] ?? 0,
    endSeconds:
      sliced.wordEndTimesSeconds[sliced.wordEndTimesSeconds.length - 1] ??
      sliced.wordStartTimesSeconds[0] ??
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
