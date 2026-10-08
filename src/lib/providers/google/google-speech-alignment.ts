import type { TtsAlignment } from '@/lib/providers/interfaces/tts.provider';
import {
  GoogleNarrationAligner,
  type GoogleNarrationAlignerConfig,
} from '@/lib/providers/narration-aligner/google-narration-aligner';

export type GoogleSpeechAlignmentConfig = GoogleNarrationAlignerConfig;

/** @deprecated Prefer `GoogleNarrationAligner` via `createNarrationAligner`. */
export async function alignAudioToText(
  text: string,
  audioBuffer: Buffer,
  config: GoogleSpeechAlignmentConfig
): Promise<{ alignment: TtsAlignment | null; strategy: 'speech-to-text' | 'estimated' | 'none' }> {
  const aligner = new GoogleNarrationAligner(config);
  const result = await aligner.align({
    text,
    audioBuffer,
    contentType: 'audio/mpeg',
    languageCode: config.languageCode,
  });

  return {
    alignment: result.alignment,
    strategy:
      result.strategy === 'provider'
        ? 'speech-to-text'
        : result.strategy === 'estimated'
          ? 'estimated'
          : 'none',
  };
}
