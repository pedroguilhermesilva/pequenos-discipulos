import { describe, expect, it } from 'vitest';
import { parseGoogleDurationSeconds } from '@/lib/providers/google/parse-google-duration';

describe('parseGoogleDurationSeconds', () => {
  it('parses protobuf duration strings', () => {
    expect(parseGoogleDurationSeconds('3.5s')).toBe(3.5);
    expect(parseGoogleDurationSeconds('0s')).toBe(0);
  });
});
