import {
  BIBLE_BOOKS,
  buildPassageId,
  getBookMeta,
  getVerseCount,
  parsePassageId,
  type Testament,
} from './bible-metadata';

export interface PassageRange {
  verseFrom: number;
  verseTo: number;
}

export interface BibleBook {
  id: string;
  name: string;
  testament: Testament;
}

export interface BibleChapterOption {
  bookId: string;
  chapter: number;
  maxVerse: number;
  passageId: string;
  defaultVerseFrom: number;
  defaultVerseTo: number;
  preview?: string;
}

export interface BiblePassage {
  id: string;
  reference: string;
  book: string;
  chapters: string;
  chapter: number;
  chapterEnd?: number;
  defaultVerseFrom: number;
  defaultVerseTo: number;
  maxVerse: number;
  preview: string;
  verses: string[];
  /** Curated passage with rich preview content */
  isCurated?: boolean;
}

export type BibleVerseLine = {
  number: number;
  text: string;
};

/** Verses shown per page inside the Bible passage dialog */
export const BIBLE_PASSAGE_VERSES_PER_PAGE = 4;

export function toBibleVerseLines(verses: string[], verseFrom: number): BibleVerseLine[] {
  return verses
    .map((text, index) => ({
      number: verseFrom + index,
      text: text.replace(/^["“]|["”]$/g, '').trim(),
    }))
    .filter((verse) => verse.text.length > 0);
}

export function parsePassageSourceVerses(
  sourceText: unknown,
  verseFrom: number,
  verseTo: number
): BibleVerseLine[] {
  if (!sourceText || typeof sourceText !== 'object') return [];

  const verses = (sourceText as { verses?: unknown }).verses;
  if (!Array.isArray(verses) || verses.length === 0) return [];

  const texts = verses.filter((verse): verse is string => typeof verse === 'string');
  if (texts.length === 0) return [];

  return toBibleVerseLines(texts, verseFrom).filter(
    (verse) => verse.number >= verseFrom && verse.number <= verseTo
  );
}

export function chunkBibleVerses(
  verses: BibleVerseLine[],
  perPage = BIBLE_PASSAGE_VERSES_PER_PAGE
): BibleVerseLine[][] {
  if (verses.length === 0) return [[]];

  const pages: BibleVerseLine[][] = [];
  for (let index = 0; index < verses.length; index += perPage) {
    pages.push(verses.slice(index, index + perPage));
  }
  return pages;
}

/** Maximum number of verses allowed in a single adaptation */
export const MAX_VERSE_SPAN = 20;

/** Curated passages recommended for children — shown as quick picks */
export const suggestedPassages: BiblePassage[] = [
  {
    id: 'mateus-2-1-3',
    reference: 'Mateus 2:1–3',
    book: 'Mateus',
    chapters: '2',
    chapter: 2,
    defaultVerseFrom: 1,
    defaultVerseTo: 3,
    maxVerse: 23,
    preview: 'Os magos seguem a estrela até Belém para adorar o menino Jesus.',
    verses: [
      'E, tendo nascido Jesus em Belém de Judeia, no tempo do rei Herodes, eis que uns magos vieram do oriente a Jerusalém, dizendo: Onde está aquele que é nascido rei dos judeus? Porque vimos a sua estrela no oriente, e viemos a adorá-lo.',
      'E o rei Herodes, ouvindo isto, perturbou-se, e toda a Jerusalém com ele.',
    ],
    isCurated: true,
  },
  {
    id: 'genesis-6-9',
    reference: 'Gênesis 6–9',
    book: 'Gênesis',
    chapters: '6–9',
    chapter: 6,
    chapterEnd: 9,
    defaultVerseFrom: 1,
    defaultVerseTo: 22,
    maxVerse: 22,
    preview: 'Deus pede a Noé que construa uma arca para salvar sua família e os animais.',
    verses: [
      'E disse Deus a Noé: O fim de toda a carne é vindo perante mim; porque a terra está cheia de violência; e eis que os desfarei com a terra.',
      'Faze para ti uma arca da madeira de gofer; farás compartimentos na arca e a betumarás por dentro e por fora com betume.',
    ],
    isCurated: true,
  },
  {
    id: '1-samuel-17',
    reference: '1 Samuel 17',
    book: '1 Samuel',
    chapters: '17',
    chapter: 17,
    defaultVerseFrom: 1,
    defaultVerseTo: 20,
    maxVerse: 58,
    preview: 'O jovem Davi enfrenta o gigante Golias confiando em Deus.',
    verses: [
      'E saiu um homem do arraial dos filisteus, por nome Golias, de Gate, cuja altura era de seis côvados e um palmo.',
      'E disse Davi ao filisteu: Tu vens a mim com espada, e com lança, e com escudo; porém eu venho a ti em nome do Senhor dos Exércitos.',
    ],
    isCurated: true,
  },
  {
    id: 'jonas-1-3',
    reference: 'Jonas 1–3',
    book: 'Jonas',
    chapters: '1–3',
    chapter: 1,
    chapterEnd: 3,
    defaultVerseFrom: 1,
    defaultVerseTo: 17,
    maxVerse: 17,
    preview: 'Jonas foge de Deus, é engolido por um grande peixe e depois obedece.',
    verses: [
      'Levantou-se, pois, Jonas, para fugir de diante do Senhor para Társis; e, descendo a Jope, achou um navio que ia para Társis.',
      'E o Senhor mandou um grande peixe que tragasse a Jonas; e esteve Jonas três dias e três noites no ventre do peixe.',
    ],
    isCurated: true,
  },
];

const curatedPassageMap = new Map(suggestedPassages.map((p) => [p.id, p]));

function slugifyBook(book: string): string {
  return book
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
}

function buildDynamicPassage(bookId: string, chapter: number): BiblePassage | undefined {
  const book = getBookMeta(bookId);
  if (!book || chapter < 1 || chapter > book.versesPerChapter.length) return undefined;

  const maxVerse = book.versesPerChapter[chapter - 1];
  const defaultVerseTo = Math.min(MAX_VERSE_SPAN, maxVerse);

  return {
    id: buildPassageId(bookId, chapter),
    reference: `${book.name} ${chapter}`,
    book: book.name,
    chapters: String(chapter),
    chapter,
    defaultVerseFrom: 1,
    defaultVerseTo,
    maxVerse,
    preview: `Passagem de ${book.name} ${chapter} — selecione os versículos que deseja adaptar.`,
    verses: [],
    isCurated: false,
  };
}

export function getBooks(): BibleBook[] {
  return BIBLE_BOOKS.map((book) => ({
    id: book.id,
    name: book.name,
    testament: book.testament,
  }));
}

export function getBooksByTestament(testament: Testament): BibleBook[] {
  return getBooks().filter((b) => b.testament === testament);
}

export function getChapters(bookId: string): BibleChapterOption[] {
  const book = getBookMeta(bookId);
  if (!book) return [];

  return book.versesPerChapter.map((maxVerse, index) => {
    const chapter = index + 1;
    const curated = suggestedPassages.find(
      (p) => slugifyBook(p.book) === bookId && p.chapter === chapter
    );

    return {
      bookId,
      chapter,
      maxVerse,
      passageId: curated?.id ?? buildPassageId(bookId, chapter),
      defaultVerseFrom: 1,
      defaultVerseTo: Math.min(MAX_VERSE_SPAN, maxVerse),
      preview: curated?.preview,
    };
  });
}

export function getChapterOption(bookId: string, chapter: number): BibleChapterOption | undefined {
  return getChapters(bookId).find((c) => c.chapter === chapter);
}

export function getMaxVerse(bookId: string, chapter: number): number {
  return getVerseCount(bookId, chapter);
}

export function findPassageId(bookId: string, chapter: number): string | undefined {
  const option = getChapterOption(bookId, chapter);
  return option?.passageId;
}

export function formatChapterReference(
  bookName: string,
  chapter: number,
  range: PassageRange
): string {
  if (range.verseFrom === range.verseTo) {
    return `${bookName} ${chapter}:${range.verseFrom}`;
  }
  return `${bookName} ${chapter}:${range.verseFrom}–${range.verseTo}`;
}

export function getVerseSpan(range: PassageRange): number {
  return range.verseTo - range.verseFrom + 1;
}

export function validateVerseRange(
  bookId: string,
  chapter: number,
  range: PassageRange
): string | null {
  const maxVerse = getMaxVerse(bookId, chapter);
  if (!maxVerse) return 'Capítulo inválido';
  if (range.verseFrom < 1 || range.verseTo < 1) return 'Os versículos devem ser maiores que zero';
  if (range.verseFrom > maxVerse || range.verseTo > maxVerse) {
    return `Os versículos devem estar entre 1 e ${maxVerse}`;
  }
  if (range.verseFrom > range.verseTo) return '"De" deve ser menor ou igual a "Até"';

  const span = getVerseSpan(range);
  if (span > MAX_VERSE_SPAN) {
    return `Selecione no máximo ${MAX_VERSE_SPAN} versículos por história`;
  }

  return null;
}

export function getSelectionFromPassageId(passageId: string): {
  bookId: string;
  chapter: number;
  verseFrom: number;
  verseTo: number;
} | null {
  const curated = curatedPassageMap.get(passageId);
  if (curated) {
    return {
      bookId: slugifyBook(curated.book),
      chapter: curated.chapter,
      verseFrom: curated.defaultVerseFrom,
      verseTo: Math.min(curated.defaultVerseTo, MAX_VERSE_SPAN),
    };
  }

  const parsed = parsePassageId(passageId);
  if (!parsed) return null;

  const passage = buildDynamicPassage(parsed.bookId, parsed.chapter);
  if (!passage) return null;

  return {
    bookId: parsed.bookId,
    chapter: parsed.chapter,
    verseFrom: passage.defaultVerseFrom,
    verseTo: passage.defaultVerseTo,
  };
}

export function getPassageById(id: string): BiblePassage | undefined {
  const curated = curatedPassageMap.get(id);
  if (curated) return curated;

  const parsed = parsePassageId(id);
  if (!parsed) return undefined;

  return buildDynamicPassage(parsed.bookId, parsed.chapter);
}

export function getPassageIdFromReference(reference: string): string | undefined {
  const trimmed = reference.trim();
  const exact = suggestedPassages.find((p) => p.reference === trimmed);
  if (exact) return exact.id;

  const normalized = trimmed.toLowerCase();
  const byBook = suggestedPassages.find((p) => normalized.startsWith(p.book.toLowerCase()));
  return byBook?.id;
}

export function resolvePassageRange(
  passage: BiblePassage,
  verseFrom: number | null,
  verseTo: number | null
): PassageRange {
  const from = verseFrom ?? passage.defaultVerseFrom;
  const to = verseTo ?? passage.defaultVerseTo;
  const clampedFrom = Math.max(1, Math.min(from, passage.maxVerse));
  const clampedTo = Math.max(clampedFrom, Math.min(to, passage.maxVerse));
  return { verseFrom: clampedFrom, verseTo: clampedTo };
}

export function isDefaultPassageRange(passage: BiblePassage, range: PassageRange): boolean {
  return range.verseFrom === passage.defaultVerseFrom && range.verseTo === passage.defaultVerseTo;
}

export function formatPassageReference(passage: BiblePassage, range?: PassageRange): string {
  const verseFrom = range?.verseFrom ?? passage.defaultVerseFrom;
  const verseTo = range?.verseTo ?? passage.defaultVerseTo;
  const isDefault = verseFrom === passage.defaultVerseFrom && verseTo === passage.defaultVerseTo;

  if (passage.chapterEnd) {
    if (isDefault) {
      return `${passage.book} ${passage.chapter}–${passage.chapterEnd}`;
    }
    if (verseFrom === verseTo) {
      return `${passage.book} ${passage.chapter}:${verseFrom}`;
    }
    return `${passage.book} ${passage.chapter}:${verseFrom}–${verseTo}`;
  }

  if (isDefault && verseFrom === 1 && verseTo === passage.maxVerse) {
    return `${passage.book} ${passage.chapter}`;
  }

  if (verseFrom === verseTo) {
    return `${passage.book} ${passage.chapter}:${verseFrom}`;
  }
  return `${passage.book} ${passage.chapter}:${verseFrom}–${verseTo}`;
}

/** @deprecated Use suggestedPassages */
export const biblePassages = suggestedPassages;
