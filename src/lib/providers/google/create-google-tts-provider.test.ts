import { describe, expect, it } from 'vitest';
import {
  createGoogleTtsProvider,
  resolveGoogleTtsRuntimeConfig,
} from '@/lib/providers/google/create-google-tts-provider';
import { GeminiFlashTtsProvider } from '@/lib/providers/google/gemini-flash-tts.provider';
import { GoogleTtsProvider } from '@/lib/providers/google/google-tts.provider';

describe('createGoogleTtsProvider', () => {
  it('creates Gemini provider by default', () => {
    const config = resolveGoogleTtsRuntimeConfig({
      GOOGLE_TTS_API_KEY: 'test-key',
      GOOGLE_CLOUD_PROJECT_ID: 'demo-project',
    });

    expect(config.provider).toBe('gemini');
    expect(config.cacheSuffix).toContain('gemini-2.5-flash-tts:Leda:');
    expect(createGoogleTtsProvider(config)).toBeInstanceOf(GeminiFlashTtsProvider);
  });

  it('creates Neural2 provider when requested', () => {
    const config = resolveGoogleTtsRuntimeConfig({
      GOOGLE_TTS_API_KEY: 'test-key',
      GOOGLE_TTS_PROVIDER: 'neural2',
      GOOGLE_TTS_VOICE: 'pt-BR-Neural2-C',
    });

    expect(config.cacheSuffix).toBe('pt-BR-Neural2-C');
    expect(createGoogleTtsProvider(config)).toBeInstanceOf(GoogleTtsProvider);
  });
});
