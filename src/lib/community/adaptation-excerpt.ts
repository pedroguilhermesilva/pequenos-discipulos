/** First readable snippet from adaptation content or note. */
export function extractAdaptationExcerpt(
  content: unknown,
  adaptationNote?: string | null,
  fallback = 'História bíblica adaptada para crianças.'
): string {
  const note = adaptationNote?.trim();
  if (note) return note.length > 200 ? `${note.slice(0, 197)}…` : note;

  const pages = (content as { pages?: Array<{ blocks?: Array<{ type?: string; text?: string }> }> })
    ?.pages;
  for (const page of pages ?? []) {
    for (const block of page.blocks ?? []) {
      const text = block.text?.trim();
      if (!text) continue;
      return text.length > 200 ? `${text.slice(0, 197)}…` : text;
    }
  }

  return fallback;
}
