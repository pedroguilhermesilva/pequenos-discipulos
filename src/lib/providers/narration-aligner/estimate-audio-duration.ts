/** Rough MP3 duration estimate from buffer size (128 kbps assumption). */
export function estimateMp3DurationSeconds(buffer: Buffer): number {
  const bitrateKbps = 128;
  return Math.max(1, (buffer.length * 8) / (bitrateKbps * 1000));
}

/** Maps BCP-47 codes to ISO 639-1 for Whisper (pt-BR → pt). */
export function whisperLanguageCode(languageCode: string): string {
  const base = languageCode.split('-')[0]?.trim().toLowerCase();
  return base || 'pt';
}
