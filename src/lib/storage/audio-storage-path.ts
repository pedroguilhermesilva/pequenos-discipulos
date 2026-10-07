const AUDIO_PATH_PATTERN = /^audio\/([^/]+)\/.+/;

export function normalizeStoragePath(segments: readonly string[]): string {
  return segments.join('/').replace(/\\/g, '/');
}

export function parseAdaptationIdFromAudioPath(relativePath: string): string | null {
  const normalized = relativePath.replace(/\\/g, '/');
  const match = normalized.match(AUDIO_PATH_PATTERN);
  return match?.[1] ?? null;
}

export function isSafeStoragePath(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, '/');
  if (!normalized || normalized.startsWith('/')) return false;
  if (normalized.includes('..')) return false;
  return AUDIO_PATH_PATTERN.test(normalized);
}
