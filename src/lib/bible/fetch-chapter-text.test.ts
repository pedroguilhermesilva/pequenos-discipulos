import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearBibliasBookJsonCache, fetchChapterVerses } from './fetch-chapter-text';

describe('fetchChapterVerses', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clearBibliasBookJsonCache();
  });

  it('loads and normalizes chapter verses from the ALM1911 source', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 'ACT',
          chapters: [
            {
              number: 2,
              verses: [
                { number: 1, text: 'Versículo 1.' },
                { number: 2, text: 'Versículo 2.' },
              ],
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const verses = await fetchChapterVerses({
      bibleVersionId: 'alm1911',
      bookId: 'atos',
      chapter: 2,
    });

    expect(verses).toEqual(['Versículo 1.', 'Versículo 2.']);
  });
});
