import { BibleTextFetchError } from '@/lib/domain/errors';
import type { BibleTextProvider } from '@/lib/providers/interfaces/bible-text.provider';
import { getBookMeta } from '@/lib/stories/bible-metadata';
import { toUsfmBookCode } from '@/lib/stories/bible-usfm';
import { resolveYouVersionBibleId } from '@/lib/stories/bible-versions';

export class BibleTextService {
  constructor(private readonly provider: BibleTextProvider) {}

  async getPassageText(input: {
    bibleVersionId: string;
    bookId: string;
    chapter: number;
    verseFrom: number;
    verseTo: number;
  }) {
    const book = getBookMeta(input.bookId);
    if (!book) {
      throw new BibleTextFetchError(`Livro inválido: ${input.bookId}`);
    }

    return this.provider.fetchPassage({
      bibleVersionId: resolveYouVersionBibleId(input.bibleVersionId),
      bookCode: toUsfmBookCode(input.bookId),
      chapter: input.chapter,
      verseFrom: input.verseFrom,
      verseTo: input.verseTo,
    });
  }
}
