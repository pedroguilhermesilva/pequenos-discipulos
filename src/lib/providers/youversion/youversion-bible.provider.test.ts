import { afterEach, describe, expect, it, vi } from 'vitest';
import { BibleTextFetchError } from '@/lib/domain/errors';
import { YouVersionBibleProvider } from '@/lib/providers/youversion/youversion-bible.provider';

describe('YouVersionBibleProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests plain text passages with the resolved bible version id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'GAL.1.1',
        content: 'Verso um. Verso dois. Verso três.',
        reference: 'Gálatas 1:1–3',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const provider = new YouVersionBibleProvider('test-key');
    const result = await provider.fetchPassage({
      bibleVersionId: '3254',
      bookCode: 'GAL',
      chapter: 1,
      verseFrom: 1,
      verseTo: 3,
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.youversion.com/v1/bibles/3254/passages/GAL.1.1-1?content_type=text',
      expect.objectContaining({
        headers: { 'X-YVP-App-Key': 'test-key' },
      })
    );
    expect(result.verses).toHaveLength(3);
    expect(result.verses[0]?.number).toBe(1);
    expect(result.rawText).toContain('Verso um');
    expect(result.reference).toBe('Gálatas 1:1–3');
  });

  it('throws when YouVersion responds with 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      })
    );

    const provider = new YouVersionBibleProvider('test-key');

    await expect(
      provider.fetchPassage({
        bibleVersionId: '211',
        bookCode: 'GAL',
        chapter: 1,
        verseFrom: 1,
        verseTo: 3,
      })
    ).rejects.toBeInstanceOf(BibleTextFetchError);
  });
});
