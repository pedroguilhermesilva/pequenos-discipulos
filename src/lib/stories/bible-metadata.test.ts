import { describe, expect, it } from 'vitest';
import { buildPassageId, parsePassageId } from './bible-metadata';
import { getPassageById } from './bible-passages';

describe('parsePassageId', () => {
  it('parses dynamic book-chapter ids', () => {
    expect(parsePassageId('mateus-2')).toEqual({ bookId: 'mateus', chapter: 2 });
    expect(parsePassageId('genesis-1')).toEqual({ bookId: 'genesis', chapter: 1 });
    expect(parsePassageId('1-samuel-17')).toEqual({ bookId: '1-samuel', chapter: 17 });
  });

  it('round-trips with buildPassageId', () => {
    const id = buildPassageId('mateus', 3);
    expect(parsePassageId(id)).toEqual({ bookId: 'mateus', chapter: 3 });
  });

  it('may parse trailing chapter from curated-style ids, but getPassageById prefers curated map', () => {
    expect(parsePassageId('mateus-2-1-3')).toEqual({ bookId: 'mateus-2-1', chapter: 3 });
    expect(getPassageById('mateus-2-1-3')?.reference).toBe('Mateus 2:1–3');
  });
});

describe('getPassageById', () => {
  it('resolves curated and dynamic passages', () => {
    expect(getPassageById('mateus-2-1-3')?.reference).toBe('Mateus 2:1–3');
    expect(getPassageById('mateus-3')?.book).toBe('Mateus');
    expect(getPassageById('genesis-7')?.chapter).toBe(7);
  });
});
