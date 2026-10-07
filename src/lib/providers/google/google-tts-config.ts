import { createHash } from 'node:crypto';

/** Default narration voice — Neural2 pt-BR feminine (see docs/google-tts-voices-pt-br.md). */
export const DEFAULT_GOOGLE_TTS_VOICE = 'pt-BR-Neural2-C';

export const DEFAULT_GOOGLE_TTS_LANGUAGE = 'pt-BR';

export type GoogleTtsProviderKind = 'gemini' | 'neural2';

/** Default provider — Gemini Flash TTS (see docs/google-tts-voices-pt-br.md). */
export const DEFAULT_GOOGLE_TTS_PROVIDER: GoogleTtsProviderKind = 'gemini';

/** Latest stable Gemini Flash TTS model on Cloud Text-to-Speech (GA, pt-BR). */
export const DEFAULT_GEMINI_TTS_MODEL = 'gemini-2.5-flash-tts';

/** Feminine Gemini voice suited to warm children's narration. */
export const DEFAULT_GEMINI_TTS_VOICE = 'Leda';

export const DEFAULT_GEMINI_TTS_STYLE_PROMPT =
  'Você é uma narradora calorosa e expressiva contando uma história bíblica para crianças em português do Brasil. Fale com ritmo calmo, entonação suave e emoção natural nos diálogos.';

export function hashStylePrompt(stylePrompt: string): string {
  return createHash('sha256').update(stylePrompt.trim()).digest('hex').slice(0, 8);
}

export function buildTtsCacheSuffix(options: {
  provider: GoogleTtsProviderKind;
  voice: string;
  model?: string;
  stylePrompt?: string;
}): string {
  if (options.provider === 'neural2') {
    return options.voice;
  }

  const model = options.model ?? DEFAULT_GEMINI_TTS_MODEL;
  const styleHash = hashStylePrompt(options.stylePrompt ?? DEFAULT_GEMINI_TTS_STYLE_PROMPT);
  return `${model}:${options.voice}:${styleHash}`;
}

/** Scopes TTS cache entries (AudioAsset blockKey) to a specific voice/model/style. */
export function ttsCacheBlockKey(baseKey: string, cacheSuffix: string): string {
  return `${baseKey}@${cacheSuffix}`;
}

export function parseGoogleTtsProvider(value: string | undefined): GoogleTtsProviderKind {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'neural2' || normalized === 'classic') {
    return 'neural2';
  }
  return 'gemini';
}
