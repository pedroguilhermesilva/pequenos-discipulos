import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LOCAL_BIBLE_VERSION_ID } from '@/lib/bible/constants';
import { BIBLE_BOOKS } from '@/lib/stories/bible-metadata';
import { BOOK_TO_USFM } from '@/lib/stories/bible-usfm';

export type LocalBibleBook = {
  abbrev: string;
  chapters: string[][];
};

export { LOCAL_BIBLE_VERSION_ID };

let cachedBooks: LocalBibleBook[] | null = null;

export function loadLocalBibleBooks(): LocalBibleBook[] {
  if (cachedBooks) return cachedBooks;

  const filePath = join(process.cwd(), 'data/bible/ALM1911.json');
  cachedBooks = JSON.parse(readFileSync(filePath, 'utf8')) as LocalBibleBook[];

  if (cachedBooks.length !== BIBLE_BOOKS.length) {
    throw new Error(
      `Bíblia local inválida: esperados ${BIBLE_BOOKS.length} livros, recebidos ${cachedBooks.length}.`
    );
  }

  return cachedBooks;
}

export function getBookIndexById(bookId: string): number {
  const index = BIBLE_BOOKS.findIndex((book) => book.id === bookId);
  if (index === -1) {
    throw new Error(`Livro bíblico desconhecido: ${bookId}`);
  }
  return index;
}

export function getBookIdByUsfmCode(bookCode: string): string | null {
  const normalized = bookCode.toUpperCase();
  for (const [bookId, usfm] of Object.entries(BOOK_TO_USFM)) {
    if (usfm === normalized) return bookId;
  }
  return null;
}

export function getVersesFromLocalBible(input: {
  bookId: string;
  chapter: number;
  verseFrom: number;
  verseTo: number;
}): Array<{ number: number; text: string }> {
  const books = loadLocalBibleBooks();
  const bookIndex = getBookIndexById(input.bookId);
  const book = books[bookIndex];
  const chapterVerses = book?.chapters[input.chapter - 1];

  if (!chapterVerses) {
    throw new Error(`Capítulo ${input.chapter} não encontrado em ${input.bookId}.`);
  }

  const verses: Array<{ number: number; text: string }> = [];
  for (let number = input.verseFrom; number <= input.verseTo; number += 1) {
    const text = chapterVerses[number - 1];
    if (typeof text !== 'string' || !text.trim()) {
      throw new Error(`Versículo ${number} não encontrado em ${input.bookId} ${input.chapter}.`);
    }
    verses.push({ number, text: text.trim() });
  }

  return verses;
}
