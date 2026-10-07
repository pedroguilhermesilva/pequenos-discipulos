/** Default narration voice — Neural2 pt-BR feminine (see docs/google-tts-voices-pt-br.md). */
export const DEFAULT_GOOGLE_TTS_VOICE = 'pt-BR-Neural2-C';

export const DEFAULT_GOOGLE_TTS_LANGUAGE = 'pt-BR';

/** Scopes TTS cache entries (AudioAsset blockKey) to a specific voice. */
export function ttsCacheBlockKey(baseKey: string, voiceName: string): string {
  return `${baseKey}@${voiceName}`;
}
