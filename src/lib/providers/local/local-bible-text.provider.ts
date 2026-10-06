import { BibleTextFetchError } from '@/lib/domain/errors';
import type {
  BiblePassageText,
  BibleTextProvider,
  FetchPassageParams,
} from '@/lib/providers/interfaces/bible-text.provider';
import {
  getBookIdByUsfmCode,
  getVersesFromLocalBible,
  LOCAL_BIBLE_VERSION_ID,
} from '@/lib/bible/local-bible';
import { getBookMeta } from '@/lib/stories/bible-metadata';

export class LocalBibleTextProvider implements BibleTextProvider {
  async fetchPassage(params: FetchPassageParams): Promise<BiblePassageText> {
    const bookId = getBookIdByUsfmCode(params.bookCode);
    if (!bookId) {
      throw new BibleTextFetchError(`Código de livro inválido: ${params.bookCode}`);
    }

    const book = getBookMeta(bookId);
    if (!book) {
      throw new BibleTextFetchError(`Livro inválido: ${bookId}`);
    }

    try {
      const verses = getVersesFromLocalBible({
        bookId,
        chapter: params.chapter,
        verseFrom: params.verseFrom,
        verseTo: params.verseTo,
      });

      const reference =
        params.verseFrom === params.verseTo
          ? `${book.name} ${params.chapter}:${params.verseFrom}`
          : `${book.name} ${params.chapter}:${params.verseFrom}–${params.verseTo}`;

      return {
        bibleVersionId: LOCAL_BIBLE_VERSION_ID,
        reference,
        verses,
        rawText: verses.map((verse) => verse.text).join(' '),
      };
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new BibleTextFetchError(detail);
    }
  }

  async listVersions() {
    return [
      {
        id: LOCAL_BIBLE_VERSION_ID,
        name: 'Almeida 1911',
        abbreviation: 'ALM1911',
      },
    ];
  }
}
