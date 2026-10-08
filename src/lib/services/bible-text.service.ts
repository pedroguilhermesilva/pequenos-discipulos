import type { Passage, Prisma, PrismaClient } from '@prisma/client';
import {
  buildPassageSourceText,
  hasPassageSourceVerses,
  parsePassageSourceVerses,
} from '@/lib/bible/source-text';
import { fetchChapterVerses } from '@/lib/bible/fetch-chapter-text';
import { BibleTextFetchError } from '@/lib/domain/errors';
import { parsePassageId } from '@/lib/stories/bible-metadata';
import { chapterReferenceForSlug } from '@/lib/stories/bible-passages';
import type { BibleVerseLine } from '@/lib/stories/bible-passages';
import { resolveBibleVersionId } from '@/lib/stories/bible-versions';

export type ResolvePassageVersesResult = {
  verses: BibleVerseLine[];
  sourceText: unknown;
  bibleVersionId: string;
  error?: string;
};

export class BibleTextService {
  constructor(private readonly prisma: PrismaClient) {}

  async resolvePassageVerses(input: {
    passage: Pick<Passage, 'id' | 'slug'> & { sourceText: unknown };
    verseFrom: number;
    verseTo: number;
    bibleVersionId?: string;
  }): Promise<ResolvePassageVersesResult> {
    const bibleVersionId = resolveBibleVersionId(input.bibleVersionId ?? 'alm1911');

    const cachedVerses = parsePassageSourceVerses(
      input.passage.sourceText,
      input.verseFrom,
      input.verseTo
    );
    if (cachedVerses.length > 0) {
      return {
        verses: cachedVerses,
        sourceText: input.passage.sourceText,
        bibleVersionId,
      };
    }

    if (hasPassageSourceVerses(input.passage.sourceText)) {
      return {
        verses: [],
        sourceText: input.passage.sourceText,
        bibleVersionId,
        error: 'O texto bíblico desta passagem está incompleto.',
      };
    }

    try {
      const parsed = parsePassageId(input.passage.slug);
      if (!parsed) {
        throw new BibleTextFetchError('Passagem bíblica inválida.');
      }

      const chapterVerses = await fetchChapterVerses({
        bibleVersionId,
        bookId: parsed.bookId,
        chapter: parsed.chapter,
      });

      const reference =
        chapterReferenceForSlug(input.passage.slug) ??
        `${parsed.bookId} ${parsed.chapter}`;

      const sourceText = buildPassageSourceText({
        reference,
        bibleVersionId,
        chapter: parsed.chapter,
        verses: chapterVerses,
      });

      await this.prisma.passage.update({
        where: { id: input.passage.id },
        data: { sourceText: sourceText as Prisma.InputJsonValue },
      });

      const verses = parsePassageSourceVerses(sourceText, input.verseFrom, input.verseTo);
      return { verses, sourceText, bibleVersionId };
    } catch (error) {
      const message =
        error instanceof BibleTextFetchError
          ? error.message
          : 'Não foi possível carregar o texto bíblico desta passagem.';

      return {
        verses: [],
        sourceText: input.passage.sourceText,
        bibleVersionId,
        error: message,
      };
    }
  }
}
