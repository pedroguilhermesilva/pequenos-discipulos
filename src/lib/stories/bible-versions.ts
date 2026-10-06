import { LOCAL_BIBLE_VERSION_ID } from '@/lib/bible/constants';

/** Única versão disponível — Almeida 1911 (referência; sem texto integral no repo). */
export const DEFAULT_BIBLE_VERSION_ID = LOCAL_BIBLE_VERSION_ID;

export const bibleVersions = [
  {
    id: DEFAULT_BIBLE_VERSION_ID,
    label: 'Almeida 1911',
    abbreviation: 'ALM1911',
  },
] as const;

/** Compatibilidade com IDs legados de versões anteriores da app. */
const LEGACY_ALIASES: Record<string, string> = {
  '3254': DEFAULT_BIBLE_VERSION_ID,
  '211': DEFAULT_BIBLE_VERSION_ID,
  '129': DEFAULT_BIBLE_VERSION_ID,
  '1608': DEFAULT_BIBLE_VERSION_ID,
  blt: DEFAULT_BIBLE_VERSION_ID,
};

export function resolveBibleVersionId(bibleVersionId: string): string {
  return LEGACY_ALIASES[bibleVersionId] ?? bibleVersionId;
}

/** @deprecated Use resolveBibleVersionId */
export const resolveYouVersionBibleId = resolveBibleVersionId;

export function getBibleVersionLabel(id: string): string {
  const resolved = resolveBibleVersionId(id);
  const found = bibleVersions.find((version) => version.id === resolved);
  if (found) return `${found.abbreviation} — ${found.label}`;
  return id;
}
