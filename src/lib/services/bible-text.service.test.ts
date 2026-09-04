import { describe, expect, it, vi } from 'vitest';
import { BibleTextService } from '@/lib/services/bible-text.service';
import { DEFAULT_BIBLE_VERSION_ID } from '@/lib/stories/bible-versions';

describe('BibleTextService', () => {
  it('resolves legacy bible version ids before calling the provider', async () => {
    const fetchPassage = vi.fn().mockResolvedValue({
      bibleVersionId: DEFAULT_BIBLE_VERSION_ID,
      reference: 'Gálatas 1:1–3',
      verses: [{ number: 1, text: 'Paulo...' }],
      rawText: 'Paulo...',
    });

    const service = new BibleTextService({ fetchPassage });
    await service.getPassageText({
      bibleVersionId: '211',
      bookId: 'galatas',
      chapter: 1,
      verseFrom: 1,
      verseTo: 3,
    });

    expect(fetchPassage).toHaveBeenCalledWith(
      expect.objectContaining({
        bibleVersionId: DEFAULT_BIBLE_VERSION_ID,
        bookCode: 'GAL',
      })
    );
  });
});
