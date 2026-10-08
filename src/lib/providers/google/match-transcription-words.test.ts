import { describe, expect, it } from 'vitest';
import { tokenizeNarrationWords } from '@/lib/providers/google/google-tts-ssml';
import { matchTranscriptionToText } from '@/lib/providers/google/match-transcription-words';

describe('matchTranscriptionToText', () => {
  it('maps transcribed words onto original tokens with punctuation differences', () => {
    const text = 'Olá, Deus! Como vai?';
    const originalWords = tokenizeNarrationWords(text);
    const alignment = matchTranscriptionToText(originalWords, [
      { word: 'Olá', startSeconds: 0, endSeconds: 0.3 },
      { word: 'Deus', startSeconds: 0.35, endSeconds: 0.7 },
      { word: 'Como', startSeconds: 0.75, endSeconds: 1.0 },
      { word: 'vai', startSeconds: 1.05, endSeconds: 1.3 },
    ]);

    expect(alignment?.words).toEqual(['Olá,', 'Deus!', 'Como', 'vai?']);
    expect(alignment?.wordStartTimesSeconds[1]).toBe(0.35);
    expect(alignment?.wordEndTimesSeconds[3]).toBeGreaterThan(1);
  });

  it('returns null when transcription is too different', () => {
    const originalWords = tokenizeNarrationWords('História completamente diferente.');
    const alignment = matchTranscriptionToText(originalWords, [
      { word: 'xyz', startSeconds: 0, endSeconds: 0.2 },
      { word: 'abc', startSeconds: 0.3, endSeconds: 0.5 },
    ]);

    expect(alignment).toBeNull();
  });
});
