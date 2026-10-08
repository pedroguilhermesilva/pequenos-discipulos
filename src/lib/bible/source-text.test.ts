import { describe, expect, it } from 'vitest';
import {
  hasPassageSourceVerses,
  parsePassageSourceVerses,
} from '@/lib/bible/source-text';

describe('parsePassageSourceVerses', () => {
  it('numbers verses from the start of the chapter and filters the requested range', () => {
    const verses = parsePassageSourceVerses(
      {
        verses: ['Um.', 'Dois.', 'Três.', 'Quatro.'],
      },
      2,
      3
    );

    expect(verses).toEqual([
      { number: 2, text: 'Dois.' },
      { number: 3, text: 'Três.' },
    ]);
  });

  it('returns an empty list when sourceText has no verses', () => {
    expect(parsePassageSourceVerses({ reference: 'Atos 2' }, 1, 47)).toEqual([]);
  });
});

describe('hasPassageSourceVerses', () => {
  it('detects stored chapter verses', () => {
    expect(hasPassageSourceVerses({ verses: ['Um.'] })).toBe(true);
    expect(hasPassageSourceVerses({ reference: 'Atos 2' })).toBe(false);
  });
});
