/**
 * Bible versions available through the YouVersion Platform for this app.
 * IDs must match versions returned by GET /v1/bibles for the licensed app key.
 */
export const DEFAULT_BIBLE_VERSION_ID =
  process.env.YVP_DEFAULT_BIBLE_VERSION_ID?.trim() || '3254';

export const bibleVersions = [
  {
    id: DEFAULT_BIBLE_VERSION_ID,
    label: 'Bíblia Livre Para Todos',
    abbreviation: 'BLT',
  },
] as const;

/** Early placeholders (NVI/ARC/ARA) — not licensed on the current YVP key. */
const YVP_LEGACY_ALIASES: Record<string, string> = {
  '211': DEFAULT_BIBLE_VERSION_ID,
  '129': DEFAULT_BIBLE_VERSION_ID,
  '1608': DEFAULT_BIBLE_VERSION_ID,
};

export function resolveYouVersionBibleId(bibleVersionId: string): string {
  return YVP_LEGACY_ALIASES[bibleVersionId] ?? bibleVersionId;
}

export function getBibleVersionLabel(id: string): string {
  const resolved = resolveYouVersionBibleId(id);
  const found = bibleVersions.find((version) => version.id === resolved);
  if (found) return `${found.abbreviation} — ${found.label}`;
  return id;
}
