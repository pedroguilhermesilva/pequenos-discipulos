import { describe, expect, it } from 'vitest';
import { LocalBibleTextProvider } from '@/lib/providers/local/local-bible-text.provider';
import { LOCAL_BIBLE_VERSION_ID } from '@/lib/bible/local-bible';

describe('LocalBibleTextProvider', () => {
  const provider = new LocalBibleTextProvider();

  it('returns Mateus 2:1-3 from embedded Almeida 1911', async () => {
    const result = await provider.fetchPassage({
      bibleVersionId: LOCAL_BIBLE_VERSION_ID,
      bookCode: 'MAT',
      chapter: 2,
      verseFrom: 1,
      verseTo: 3,
    });

    expect(result.verses).toHaveLength(3);
    expect(result.verses[0]?.text).toMatch(/nascido Jesus/i);
    expect(result.verses[1]?.text).toMatch(/estrella|estrela/i);
    expect(result.reference).toMatch(/Mateus 2:1/);
  });

  it('lists the local Almeida version', async () => {
    const versions = await provider.listVersions();
    expect(versions).toEqual([
      expect.objectContaining({ id: LOCAL_BIBLE_VERSION_ID, abbreviation: 'ALM1911' }),
    ]);
  });
});
