import type { ContentType } from './types';

export type StoryFlowStep = 'passagem' | 'tipo' | 'historia';

interface StoryUrlOptions {
  passageId?: string;
  contentType?: ContentType;
  /** Skip generation animation for stories already in progress */
  ready?: boolean;
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

export function parseStorySearchParams(searchParams: URLSearchParams): {
  passageId: string | null;
  contentType: ContentType | null;
  ready: boolean;
  verseFrom: number | null;
  verseTo: number | null;
} {
  const tipo = searchParams.get('tipo');
  const validTypes: ContentType[] = ['text', 'audio', 'video'];

  return {
    passageId: searchParams.get('passagem'),
    contentType: tipo && validTypes.includes(tipo as ContentType) ? (tipo as ContentType) : null,
    ready: searchParams.get('pronto') === '1',
    verseFrom: parseVerseParam(searchParams.get('de')),
    verseTo: parseVerseParam(searchParams.get('ate')),
  };
}
