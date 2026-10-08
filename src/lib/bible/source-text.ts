import type { BibleVerseLine } from '@/lib/stories/bible-passages';

export type PassageSourceText = {
  reference?: string;
  bibleVersionId?: string;
  chapter?: number;
  verses?: string[];
};

export function parsePassageSourceText(sourceText: unknown): PassageSourceText | null {
  if (!sourceText || typeof sourceText !== 'object') return null;
  return sourceText as PassageSourceText;
}

export function hasPassageSourceVerses(sourceText: unknown): boolean {
  const parsed = parsePassageSourceText(sourceText);
  return Array.isArray(parsed?.verses) && parsed!.verses!.some((verse) => typeof verse === 'string' && verse.trim().length > 0);
}

export function buildPassageSourceText(input: {
  reference: string;
  bibleVersionId: string;
  chapter: number;
  verses: string[];
}): PassageSourceText {
  return {
    reference: input.reference,
    bibleVersionId: input.bibleVersionId,
    chapter: input.chapter,
    verses: input.verses,
  };
}

export function parsePassageSourceVerses(
  sourceText: unknown,
  verseFrom: number,
  verseTo: number
): BibleVerseLine[] {
  const parsed = parsePassageSourceText(sourceText);
  if (!parsed?.verses || !Array.isArray(parsed.verses) || parsed.verses.length === 0) {
    return [];
  }

  const texts = parsed.verses.filter((verse): verse is string => typeof verse === 'string');
  if (texts.length === 0) return [];

  return texts
    .map((text, index) => ({
      number: index + 1,
      text: text.replace(/^["“]|["”]$/g, '').trim(),
    }))
    .filter(
      (verse) =>
        verse.text.length > 0 && verse.number >= verseFrom && verse.number <= verseTo
    );
}
