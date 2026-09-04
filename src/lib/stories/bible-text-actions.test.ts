import { describe, expect, it } from 'vitest';
import { getBiblePassageTextAction } from '@/lib/stories/bible-text-actions';

describe('bible-text-actions', () => {
  it('returns verses for a valid passage slug', async () => {
    const result = await getBiblePassageTextAction({
      passageSlug: 'mateus-2-1-3',
      verseFrom: 1,
      verseTo: 3,
      bibleVersionId: '211',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.reference).toMatch(/mateus|mat/i);
    expect(result.data.verses.length).toBeGreaterThan(0);
    expect(result.data.verses[0]?.text.length).toBeGreaterThan(0);
  });

  it('returns not found for an invalid passage slug', async () => {
    const result = await getBiblePassageTextAction({
      passageSlug: 'invalid-passage',
      verseFrom: 1,
      verseTo: 1,
      bibleVersionId: '211',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('NOT_FOUND');
  });
});
