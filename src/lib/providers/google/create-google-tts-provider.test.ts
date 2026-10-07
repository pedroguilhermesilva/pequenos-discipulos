import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createGoogleTtsProvider,
  resolveGoogleTtsRuntimeConfig,
} from '@/lib/providers/google/create-google-tts-provider';
import { GeminiFlashTtsProvider } from '@/lib/providers/google/gemini-flash-tts.provider';
import { GoogleTtsProvider } from '@/lib/providers/google/google-tts.provider';

const env = (values: Record<string, string>) => values as unknown as NodeJS.ProcessEnv;

describe('createGoogleTtsProvider', () => {
  it('creates Gemini provider by default', () => {
    const config = resolveGoogleTtsRuntimeConfig(env({
      GOOGLE_TTS_API_KEY: 'test-key',
      GOOGLE_CLOUD_PROJECT_ID: 'demo-project',
    }));

    expect(config.provider).toBe('gemini');
    expect(config.cacheSuffix).toContain('gemini-2.5-flash-tts:Leda:');
    expect(
      createGoogleTtsProvider(config, env({
        NARRATION_ALIGNER: 'google',
      }))
    ).toBeInstanceOf(GeminiFlashTtsProvider);
  });

  it('creates Neural2 provider when requested', () => {
    const config = resolveGoogleTtsRuntimeConfig(env({
      GOOGLE_TTS_API_KEY: 'test-key',
      GOOGLE_TTS_PROVIDER: 'neural2',
      GOOGLE_TTS_VOICE: 'pt-BR-Neural2-C',
    }));

    expect(config.cacheSuffix).toBe('pt-BR-Neural2-C');
    expect(createGoogleTtsProvider(config)).toBeInstanceOf(GoogleTtsProvider);
  });

  it('does not throw when creating Gemini provider without GOOGLE_CLOUD_PROJECT_ID', () => {
    const config = resolveGoogleTtsRuntimeConfig(env({ GOOGLE_TTS_API_KEY: 'test-key' }));

    expect(config.projectId).toBeUndefined();
    expect(() => createGoogleTtsProvider(config, env({}))).not.toThrow();
    expect(createGoogleTtsProvider(config, env({}))).toBeInstanceOf(GeminiFlashTtsProvider);
  });
});

describe('importing the container without GOOGLE_CLOUD_PROJECT_ID', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('GOOGLE_TTS_API_KEY', 'test-key');
    vi.stubEnv('GOOGLE_CLOUD_PROJECT_ID', '');
    vi.stubEnv('GOOGLE_TTS_CREDENTIALS_JSON', '');
    vi.stubEnv('TTS_USE_STUB', 'false');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does not throw at module evaluation (build time)', async () => {
    await expect(import('@/lib/container')).resolves.toBeDefined();
  });

  it('does not throw at module evaluation when Groq is selected without GROQ_API_KEY', async () => {
    vi.stubEnv('NARRATION_ALIGNER', 'groq');
    vi.stubEnv('GROQ_API_KEY', '');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(import('@/lib/container')).resolves.toBeDefined();
    warnSpy.mockRestore();
  });
});
