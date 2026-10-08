import { describe, expect, it } from 'vitest';
import { tokenizeNarrationWords } from '@/lib/providers/google/google-tts-ssml';
import { timepointsToAlignment } from '@/lib/providers/google/timepoints-to-alignment';

describe('timepointsToAlignment', () => {
  it('maps mark timepoints to per-word start and end seconds', () => {
    const text = 'Olá Deus';
    const words = tokenizeNarrationWords(text);
    const alignment = timepointsToAlignment(words, [
      { markName: 'w0', timeSeconds: 0 },
      { markName: 'w1', timeSeconds: 0.4 },
      { markName: 'end', timeSeconds: 0.9 },
    ]);

    expect(alignment.words).toEqual(['Olá', 'Deus']);
    expect(alignment.wordStartTimesSeconds).toEqual([0, 0.4]);
    expect(alignment.wordEndTimesSeconds).toEqual([0.4, 0.9]);
    expect(alignment.wordCharStarts).toEqual([0, 4]);
    expect(alignment.wordCharEnds).toEqual([3, 8]);
  });
});
