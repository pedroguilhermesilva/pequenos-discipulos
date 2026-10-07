import type { TtsAlignment } from '@/lib/providers/interfaces/tts.provider';
import { tokenizeNarrationWords } from '@/lib/providers/google/google-tts-ssml';

/** Evenly distributes words across a known audio duration when STT alignment is unavailable. */
export function estimateAlignmentFromDuration(
  text: string,
  durationSeconds: number
): TtsAlignment {
  const tokens = tokenizeNarrationWords(text);
  if (tokens.length === 0) {
    return {
      words: [],
      wordStartTimesSeconds: [],
      wordEndTimesSeconds: [],
      wordCharStarts: [],
      wordCharEnds: [],
    };
  }

  const safeDuration = Math.max(durationSeconds, tokens.length * 0.15);
  const step = safeDuration / tokens.length;

  return {
    words: tokens.map((token) => token.text),
    wordStartTimesSeconds: tokens.map((_, index) => index * step),
    wordEndTimesSeconds: tokens.map((_, index) => (index + 1) * step),
    wordCharStarts: tokens.map((token) => token.charStart),
    wordCharEnds: tokens.map((token) => token.charEnd),
  };
}
