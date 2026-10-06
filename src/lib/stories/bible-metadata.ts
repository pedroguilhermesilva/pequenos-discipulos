import bibleIndex from '../../../data/bible/index.json';

export type Testament = 'old' | 'new';

export interface BibleBookMeta {
  id: string;
  name: string;
  abbrev: string;
  slug: string;
  testament: Testament;
  order: number;
  /** Verse count per chapter; index 0 = chapter 1 */
  versesPerChapter: readonly number[];
}

export const BIBLE_BOOKS: readonly BibleBookMeta[] = bibleIndex as BibleBookMeta[];

export const BIBLE_BOOK_MAP = new Map(BIBLE_BOOKS.map((b) => [b.id, b]));

export function getBookMeta(bookId: string): BibleBookMeta | undefined {
  return BIBLE_BOOK_MAP.get(bookId);
}

export function getChapterCount(bookId: string): number {
  return getBookMeta(bookId)?.versesPerChapter.length ?? 0;
}

export function getVerseCount(bookId: string, chapter: number): number {
  const book = getBookMeta(bookId);
  if (!book || chapter < 1 || chapter > book.versesPerChapter.length) return 0;
  return book.versesPerChapter[chapter - 1];
}

export function buildPassageId(bookId: string, chapter: number): string {
  return `${bookId}-${chapter}`;
}

export function parsePassageId(id: string): { bookId: string; chapter: number } | null {
  const match = id.match(/^(.+)-(\d+)$/);
  if (!match) return null;
  const chapter = parseInt(match[2], 10);
  if (!Number.isFinite(chapter) || chapter < 1) return null;
  return { bookId: match[1], chapter };
}
