/** Parses Google protobuf Duration strings such as "3.5s" into seconds. */
export function parseGoogleDurationSeconds(value: string | undefined): number {
  if (!value) return 0;
  const trimmed = value.trim();
  if (trimmed.endsWith('s')) {
    const parsed = Number.parseFloat(trimmed.slice(0, -1));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : 0;
}
