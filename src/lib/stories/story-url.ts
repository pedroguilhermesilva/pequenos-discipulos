import type { ContentType } from './types';

export type StoryFlowStep = 'passagem' | 'tipo' | 'historia';

interface StoryUrlOptions {
  passageId?: string;
  contentType?: ContentType;
  /** Skip generation animation for stories already in progress */
  ready?: boolean;
  /** Persisted UserStory id while staying on /stories/nova (avoids route remount) */
  historiaId?: string;
  bookId?: string;
  chapter?: number;
  verseFrom?: number;
  verseTo?: number;
}

export function buildStoryUrl(storyId: string, options: StoryUrlOptions = {}): string {
  const params = new URLSearchParams();

  if (options.passageId) {
    params.set('passagem', options.passageId);
  }
  if (options.contentType) {
    params.set('tipo', options.contentType);
  }
  if (options.ready) {
    params.set('pronto', '1');
  }
  if (options.historiaId) {
    params.set('historia', options.historiaId);
  }
  if (options.bookId) {
    params.set('livro', options.bookId);
  }
  if (options.chapter !== undefined) {
    params.set('capitulo', String(options.chapter));
  }
  if (options.verseFrom !== undefined) {
    params.set('de', String(options.verseFrom));
  }
  if (options.verseTo !== undefined) {
    params.set('ate', String(options.verseTo));
  }

  const query = params.toString();
  return query ? `/stories/${storyId}?${query}` : `/stories/${storyId}`;
}

function parseVerseParam(value: string | null): number | null {
  if (!value) return null;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export type ParsedStorySearchParams = {
  passageId: string | null;
  contentType: ContentType | null;
  ready: boolean;
  historiaId: string | null;
  bookId: string | null;
  chapter: number | null;
  verseFrom: number | null;
  verseTo: number | null;
};

export function parseStorySearchParams(searchParams: URLSearchParams): ParsedStorySearchParams {
  const tipo = searchParams.get('tipo');
  const validTypes: ContentType[] = ['text', 'audio', 'video'];
  const livro = searchParams.get('livro')?.trim() || null;

  const historia = searchParams.get('historia')?.trim();

  return {
    passageId: searchParams.get('passagem'),
    contentType: tipo && validTypes.includes(tipo as ContentType) ? (tipo as ContentType) : null,
    ready: searchParams.get('pronto') === '1',
    historiaId: historia || null,
    bookId: livro,
    chapter: parseVerseParam(searchParams.get('capitulo')),
    verseFrom: parseVerseParam(searchParams.get('de')),
    verseTo: parseVerseParam(searchParams.get('ate')),
  };
}

export function parsedStorySearchParamsFromRecord(
  query: Record<string, string | string[] | undefined>
): ParsedStorySearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string') {
      params.set(key, value);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
    }
  }
  return parseStorySearchParams(params);
}
