import { describe, expect, it } from 'vitest';
import {
  chunkBibleVerses,
  formatPassageReference,
  getChapterOption,
  getPassageById,
  getSelectionFromPassageId,
  toBibleVerseLines,
  validateVerseRange,
  BIBLE_PASSAGE_VERSES_PER_PAGE,
} from './bible-passages';

describe('toBibleVerseLines', () => {
  it('assigns verse numbers from the selected range', () => {
    const lines = toBibleVerseLines(['Primeiro versículo.', 'Segundo versículo.'], 3);
    expect(lines).toEqual([
      { number: 3, text: 'Primeiro versículo.' },
      { number: 4, text: 'Segundo versículo.' },
    ]);
  });
});

describe('chunkBibleVerses', () => {
  it('splits verses into pages', () => {
    const verses = Array.from({ length: 9 }, (_, index) => ({
      number: index + 1,
      text: `Verso ${index + 1}`,
    }));

    const pages = chunkBibleVerses(verses, BIBLE_PASSAGE_VERSES_PER_PAGE);
    expect(pages).toHaveLength(3);
    expect(pages[0]).toHaveLength(4);
    expect(pages[2]).toHaveLength(1);
  });
});

describe('verse range against chapter length', () => {
  it('defaults a chapter selection to verse 1 through the last verse', () => {
    const mateus1 = getChapterOption('mateus', 1);
    expect(mateus1?.maxVerse).toBe(25);
    expect(mateus1?.defaultVerseFrom).toBe(1);
    expect(mateus1?.defaultVerseTo).toBe(25);
  });

  it('accepts a range from mid-chapter to the end', () => {
    expect(validateVerseRange('mateus', 2, { verseFrom: 5, verseTo: 23 })).toBeNull();
    expect(validateVerseRange('mateus', 2, { verseFrom: 10, verseTo: 13 })).toBeNull();
  });

  it('rejects when "De" is after "Até"', () => {
    expect(validateVerseRange('mateus', 2, { verseFrom: 13, verseTo: 10 })).toBe(
      '"De" deve ser menor ou igual a "Até"'
    );
  });

  it('rejects a verse past the chapter length', () => {
    expect(validateVerseRange('mateus', 1, { verseFrom: 1, verseTo: 999 })).toBe(
      'Os versículos devem estar entre 1 e 25'
    );
  });

  it('keeps curated suggestion ranges intact', () => {
    expect(getSelectionFromPassageId('mateus-2-1-3')).toEqual({
      bookId: 'mateus',
      chapter: 2,
      verseFrom: 1,
      verseTo: 3,
    });
  });
});

describe('formatPassageReference', () => {
  it('includes verses for a full chapter range', () => {
    const passage = getPassageById('mateus-1');
    expect(passage).toBeDefined();
    expect(formatPassageReference(passage!, { verseFrom: 1, verseTo: 25 })).toBe('Mateus 1:1–25');
  });

  it('includes verses for a partial range', () => {
    const passage = getPassageById('mateus-1');
    expect(formatPassageReference(passage!, { verseFrom: 10, verseTo: 13 })).toBe(
      'Mateus 1:10–13'
    );
  });

  it('formats a single verse', () => {
    const passage = getPassageById('mateus-1');
    expect(formatPassageReference(passage!, { verseFrom: 20, verseTo: 20 })).toBe('Mateus 1:20');
  });

  it('uses the passage default range when none is given', () => {
    const passage = getPassageById('mateus-1');
    expect(formatPassageReference(passage!)).toBe('Mateus 1:1–25');
  });
});
