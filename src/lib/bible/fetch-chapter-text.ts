import { BibleTextFetchError } from '@/lib/domain/errors';
import { toUsfmBookCode } from '@/lib/stories/bible-usfm';
import { resolveBibleVersionId } from '@/lib/stories/bible-versions';

const DEFAULT_BIBLIAS_TAG = 'v1.0.0';
const DEFAULT_BIBLIAS_BASE_URL = `https://raw.githubusercontent.com/damarals/biblias/${DEFAULT_BIBLIAS_TAG}/data/canonical`;

const VERSION_FOLDER: Record<string, string> = {
  alm1911: 'ALM1911',
};

type BibliasVerse = {
  number: number;
  text: string;
};

type BibliasChapter = {
  number: number;
  verses: BibliasVerse[];
};

type BibliasBookJson = {
  code: string;
  chapters: BibliasChapter[];
};

const bookJsonCache = new Map<string, BibliasBookJson>();

function getBibliasBaseUrl(): string {
  return process.env.BIBLE_TEXT_BASE_URL?.trim() || DEFAULT_BIBLIAS_BASE_URL;
}

function getVersionFolder(bibleVersionId: string): string {
  const resolved = resolveBibleVersionId(bibleVersionId);
  const folder = VERSION_FOLDER[resolved];
  if (!folder) {
    throw new BibleTextFetchError('Tradução bíblica não suportada para leitura do texto original.');
  }
  return folder;
}

function buildBookJsonUrl(bibleVersionId: string, bookId: string): string {
  const usfmCode = toUsfmBookCode(bookId);
  const folder = getVersionFolder(bibleVersionId);
  return `${getBibliasBaseUrl()}/${folder}/${usfmCode}.json`;
}

async function fetchBookJson(bibleVersionId: string, bookId: string): Promise<BibliasBookJson> {
  const cacheKey = `${resolveBibleVersionId(bibleVersionId)}:${bookId}`;
  const cached = bookJsonCache.get(cacheKey);
  if (cached) return cached;

  const url = buildBookJsonUrl(bibleVersionId, bookId);
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 * 60 * 24 },
    });
  } catch {
    throw new BibleTextFetchError('Não foi possível ligar à fonte do texto bíblico.');
  }

  if (!response.ok) {
    throw new BibleTextFetchError('Não foi possível obter o texto bíblico para esta passagem.');
  }

  let payload: BibliasBookJson;
  try {
    payload = (await response.json()) as BibliasBookJson;
  } catch {
    throw new BibleTextFetchError('A resposta do texto bíblico veio num formato inválido.');
  }

  if (!Array.isArray(payload.chapters)) {
    throw new BibleTextFetchError('A resposta do texto bíblico veio incompleta.');
  }

  bookJsonCache.set(cacheKey, payload);
  return payload;
}

export async function fetchChapterVerses(input: {
  bibleVersionId: string;
  bookId: string;
  chapter: number;
}): Promise<string[]> {
  const bookJson = await fetchBookJson(input.bibleVersionId, input.bookId);
  const chapter = bookJson.chapters.find((entry) => entry.number === input.chapter);
  if (!chapter || !Array.isArray(chapter.verses) || chapter.verses.length === 0) {
    throw new BibleTextFetchError('Capítulo bíblico não encontrado na tradução selecionada.');
  }

  const sorted = [...chapter.verses].sort((a, b) => a.number - b.number);
  const maxVerse = sorted[sorted.length - 1]?.number ?? 0;
  const byNumber = new Map(sorted.map((verse) => [verse.number, verse.text.trim()]));

  return Array.from({ length: maxVerse }, (_, index) => byNumber.get(index + 1) ?? '');
}

/** Expõe cache para testes. */
export function clearBibliasBookJsonCache(): void {
  bookJsonCache.clear();
}
