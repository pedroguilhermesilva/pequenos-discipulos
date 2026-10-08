import { describe, expect, it } from 'vitest';
import {
  buildTtsCacheSuffix,
  DEFAULT_GEMINI_TTS_MODEL,
  DEFAULT_GEMINI_TTS_STYLE_PROMPT,
  DEFAULT_GEMINI_TTS_VOICE,
  DEFAULT_GOOGLE_TTS_PROVIDER,
  DEFAULT_GOOGLE_TTS_VOICE,
  hashStylePrompt,
  parseGoogleTtsProvider,
  ttsCacheBlockKey,
} from '@/lib/providers/google/google-tts-config';

describe('google-tts-config', () => {
  it('defaults to gemini provider and keeps Neural2 voice constant', () => {
    expect(DEFAULT_GOOGLE_TTS_PROVIDER).toBe('gemini');
    expect(DEFAULT_GOOGLE_TTS_VOICE).toBe('pt-BR-Neural2-C');
    expect(DEFAULT_GEMINI_TTS_MODEL).toBe('gemini-2.5-flash-tts');
    expect(DEFAULT_GEMINI_TTS_VOICE).toBe('Leda');
  });

  it('builds voice-scoped cache block keys', () => {
    expect(ttsCacheBlockKey('story-narration', 'pt-BR-Neural2-C')).toBe(
      'story-narration@pt-BR-Neural2-C'
    );
  });

  it('includes model and style hash for gemini cache suffix', () => {
    const suffix = buildTtsCacheSuffix({
      provider: 'gemini',
      voice: DEFAULT_GEMINI_TTS_VOICE,
      model: DEFAULT_GEMINI_TTS_MODEL,
      stylePrompt: DEFAULT_GEMINI_TTS_STYLE_PROMPT,
    });

    expect(suffix).toBe(
      `${DEFAULT_GEMINI_TTS_MODEL}:${DEFAULT_GEMINI_TTS_VOICE}:${hashStylePrompt(DEFAULT_GEMINI_TTS_STYLE_PROMPT)}`
    );
  });

  it('parses provider aliases', () => {
    expect(parseGoogleTtsProvider('neural2')).toBe('neural2');
    expect(parseGoogleTtsProvider('classic')).toBe('neural2');
    expect(parseGoogleTtsProvider('gemini')).toBe('gemini');
    expect(parseGoogleTtsProvider(undefined)).toBe('gemini');
  });
});
