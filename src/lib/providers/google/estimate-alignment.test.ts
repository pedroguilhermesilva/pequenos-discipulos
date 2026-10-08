import { describe, expect, it } from 'vitest';
import { estimateAlignmentFromDuration } from '@/lib/providers/google/estimate-alignment';

describe('estimateAlignmentFromDuration', () => {
  it('distributes words evenly across the duration', () => {
    const alignment = estimateAlignmentFromDuration('Um dois três', 3);

    expect(alignment.words).toEqual(['Um', 'dois', 'três']);
    expect(alignment.wordStartTimesSeconds).toEqual([0, 1, 2]);
    expect(alignment.wordEndTimesSeconds).toEqual([1, 2, 3]);
  });
});
