import { describe, expect, it, vi } from 'vitest';
import { BibleTextFetchError } from '@/lib/domain/errors';
import { FallbackBibleTextProvider } from '@/lib/providers/fallback-bible-text.provider';
import type { BibleTextProvider } from '@/lib/providers/interfaces/bible-text.provider';

const params = {
  bibleVersionId: '211',
  bookCode: 'MAT',
  chapter: 1,
  verseFrom: 1,
  verseTo: 3,
};

describe('FallbackBibleTextProvider', () => {
  it('uses fallback when primary fails', async () => {
    const primary: BibleTextProvider = {
      fetchPassage: vi.fn().mockRejectedValue(new BibleTextFetchError('404')),
    };
    const fallback: BibleTextProvider = {
      fetchPassage: vi.fn().mockResolvedValue({
        bibleVersionId: '211',
        reference: 'MAT 1:1–3',
        verses: [{ number: 1, text: 'stub' }],
        rawText: 'stub',
      }),
    };

    const provider = new FallbackBibleTextProvider(primary, fallback);
    const result = await provider.fetchPassage(params);

    expect(result.rawText).toBe('stub');
    expect(primary.fetchPassage).toHaveBeenCalledOnce();
    expect(fallback.fetchPassage).toHaveBeenCalledOnce();
  });
});
