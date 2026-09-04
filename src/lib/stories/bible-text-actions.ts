'use server';

import { container } from '@/lib/container';
import { toActionError } from '@/lib/domain/errors';
import { getSelectionFromPassageId } from '@/lib/stories/bible-passages';

export async function getBiblePassageTextAction(input: {
  passageSlug: string;
  verseFrom: number;
  verseTo: number;
  bibleVersionId: string;
}) {
  try {
    const selection = getSelectionFromPassageId(input.passageSlug);
    if (!selection) {
      return { ok: false as const, code: 'NOT_FOUND' as const, message: 'Passagem inválida.' };
    }

    const text = await container.services.bibleText.getPassageText({
      bibleVersionId: input.bibleVersionId,
      bookId: selection.bookId,
      chapter: selection.chapter,
      verseFrom: input.verseFrom,
      verseTo: input.verseTo,
    });

    return {
      ok: true as const,
      data: {
        reference: text.reference,
        verses: text.verses.map((verse) => ({
          number: verse.number,
          text: verse.text,
        })),
      },
    };
  } catch (error) {
    return toActionError(error);
  }
}
