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
    if (apiKey) {
      return new GroqWhisperNarrationAligner({
        apiKey,
        model: env.GROQ_WHISPER_MODEL?.trim() || DEFAULT_GROQ_WHISPER_MODEL,
      });
    }

    // Não lançar erro aqui: isto corre na avaliação do módulo (build da Vercel).
    console.warn(
      '[createNarrationAligner] NARRATION_ALIGNER=groq mas GROQ_API_KEY não está definida; usando o alinhador Google (ou tempos estimados).'
    );
  }

  return new GoogleNarrationAligner(googleConfig);
}
