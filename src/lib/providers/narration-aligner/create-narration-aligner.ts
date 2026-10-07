import type { NarrationAligner } from '@/lib/providers/interfaces/narration-aligner';
import {
  GoogleNarrationAligner,
  type GoogleNarrationAlignerConfig,
} from '@/lib/providers/narration-aligner/google-narration-aligner';
import {
  DEFAULT_GROQ_WHISPER_MODEL,
  GroqWhisperNarrationAligner,
} from '@/lib/providers/narration-aligner/groq-whisper-narration-aligner';

export type NarrationAlignerKind = 'google' | 'groq';

export const DEFAULT_NARRATION_ALIGNER: NarrationAlignerKind = 'google';

export function parseNarrationAligner(value: string | undefined): NarrationAlignerKind {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'groq') return 'groq';
  return 'google';
}

export function createNarrationAligner(
  env: NodeJS.ProcessEnv,
  googleConfig: GoogleNarrationAlignerConfig
): NarrationAligner {
  const kind = parseNarrationAligner(env.NARRATION_ALIGNER ?? DEFAULT_NARRATION_ALIGNER);

  if (kind === 'groq') {
    const apiKey = env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('NARRATION_ALIGNER=groq exige GROQ_API_KEY.');
    }

    return new GroqWhisperNarrationAligner({
      apiKey,
      model: env.GROQ_WHISPER_MODEL?.trim() || DEFAULT_GROQ_WHISPER_MODEL,
    });
  }

  return new GoogleNarrationAligner(googleConfig);
}
