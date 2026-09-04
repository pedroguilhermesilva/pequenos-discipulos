import { describe, expect, it } from 'vitest';
import {
  chunkBibleVerses,
  toBibleVerseLines,
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
