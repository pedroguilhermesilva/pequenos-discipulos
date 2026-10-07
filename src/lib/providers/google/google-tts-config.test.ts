import { describe, expect, it } from 'vitest';
import {
  DEFAULT_GOOGLE_TTS_VOICE,
  ttsCacheBlockKey,
} from '@/lib/providers/google/google-tts-config';

describe('google-tts-config', () => {
  it('defaults to pt-BR-Neural2-C', () => {
    expect(DEFAULT_GOOGLE_TTS_VOICE).toBe('pt-BR-Neural2-C');
  });

  it('builds voice-scoped cache block keys', () => {
    expect(ttsCacheBlockKey('story-narration', 'pt-BR-Neural2-C')).toBe(
      'story-narration@pt-BR-Neural2-C'
    );
  });
});
