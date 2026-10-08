import type { TtsAlignment } from '@/lib/providers/interfaces/tts.provider';
import type { NarrationWordToken } from '@/lib/providers/google/google-tts-ssml';

export type GoogleTimepoint = {
  markName: string;
  timeSeconds: number;
};

export function timepointsToAlignment(
  words: NarrationWordToken[],
  timepoints: GoogleTimepoint[]
): TtsAlignment {
  const byName = new Map(timepoints.map((point) => [point.markName, point.timeSeconds]));

  const wordTexts: string[] = [];
  const wordStartTimesSeconds: number[] = [];
  const wordEndTimesSeconds: number[] = [];
  const wordCharStarts: number[] = [];
  const wordCharEnds: number[] = [];

  const endMark = byName.get('end');

  for (let index = 0; index < words.length; index++) {
    const token = words[index];
    const start = byName.get(`w${index}`) ?? (index === 0 ? 0 : wordEndTimesSeconds[index - 1] ?? 0);
    const nextStart = byName.get(`w${index + 1}`);
    const end =
      nextStart ??
      (index === words.length - 1 && endMark != null ? endMark : start + 0.25);

    wordTexts.push(token.text);
    wordStartTimesSeconds.push(start);
    wordEndTimesSeconds.push(end);
    wordCharStarts.push(token.charStart);
    wordCharEnds.push(token.charEnd);
  }

  return {
    words: wordTexts,
    wordStartTimesSeconds,
    wordEndTimesSeconds,
    wordCharStarts,
    wordCharEnds,
  };
}
