import type { TtsAlignment } from '@/lib/providers/interfaces/tts.provider';
import type { NarrationWordToken } from '@/lib/providers/google/google-tts-ssml';

export type TranscribedWord = {
  word: string;
  startSeconds: number;
  endSeconds: number;
};

function normalizeWord(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');
}

function wordsSimilar(original: string, transcribed: string): boolean {
  const left = normalizeWord(original);
  const right = normalizeWord(transcribed);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.startsWith(right) || right.startsWith(left)) return true;
  return levenshteinDistance(left, right) <= Math.max(1, Math.floor(Math.min(left.length, right.length) * 0.35));
}

function levenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

/**
 * Maps Speech-to-Text word timings onto the original narration tokens, tolerating
 * minor transcription differences (punctuation, accents, skipped filler words).
 */
export function matchTranscriptionToText(
  originalWords: NarrationWordToken[],
  transcribedWords: TranscribedWord[]
): TtsAlignment | null {
  if (originalWords.length === 0 || transcribedWords.length === 0) {
    return null;
  }

  const matchedStarts: number[] = [];
  const matchedEnds: number[] = [];
  let transcriptIndex = 0;
  let strongMatches = 0;

  for (const token of originalWords) {
    let bestIndex = -1;

    for (let candidate = transcriptIndex; candidate < transcribedWords.length; candidate++) {
      if (wordsSimilar(token.text, transcribedWords[candidate].word)) {
        bestIndex = candidate;
        break;
      }
    }

    if (bestIndex === -1) {
      for (let candidate = transcriptIndex; candidate < transcribedWords.length; candidate++) {
        if (normalizeWord(transcribedWords[candidate].word).length > 0) {
          bestIndex = candidate;
          break;
        }
      }
    }

    if (bestIndex === -1) {
      const previousEnd = matchedEnds[matchedEnds.length - 1] ?? 0;
      matchedStarts.push(previousEnd);
      matchedEnds.push(previousEnd + 0.2);
      continue;
    }

    const transcribed = transcribedWords[bestIndex];
    if (wordsSimilar(token.text, transcribed.word)) {
      strongMatches += 1;
    }
    matchedStarts.push(transcribed.startSeconds);
    matchedEnds.push(Math.max(transcribed.endSeconds, transcribed.startSeconds + 0.05));
    transcriptIndex = bestIndex + 1;
  }

  for (let index = 1; index < matchedStarts.length; index++) {
    if (matchedStarts[index] < matchedEnds[index - 1]) {
      matchedStarts[index] = matchedEnds[index - 1];
    }
    if (matchedEnds[index] < matchedStarts[index]) {
      matchedEnds[index] = matchedStarts[index] + 0.05;
    }
  }

  const matchRatio = strongMatches / originalWords.length;
  if (matchRatio < 0.45) {
    return null;
  }

  return {
    words: originalWords.map((token) => token.text),
    wordStartTimesSeconds: matchedStarts,
    wordEndTimesSeconds: matchedEnds,
    wordCharStarts: originalWords.map((token) => token.charStart),
    wordCharEnds: originalWords.map((token) => token.charEnd),
  };
}
