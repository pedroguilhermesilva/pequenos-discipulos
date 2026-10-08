import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createGoogleTtsProvider,
  resolveGoogleTtsRuntimeConfig,
  selectTtsProvider,
} from '@/lib/providers/google/create-google-tts-provider';
import { GeminiFlashTtsProvider } from '@/lib/providers/google/gemini-flash-tts.provider';
import { GoogleTtsProvider } from '@/lib/providers/google/google-tts.provider';
import { StubTtsProvider, UnconfiguredTtsProvider } from '@/lib/providers/stubs/stub-tts.provider';

const env = (values: Record<string, string>) => values as unknown as NodeJS.ProcessEnv;
const CREDS = '{"client_email":"sa@p.iam.gserviceaccount.com","private_key":"k","project_id":"json-project"}';

describe('resolveGoogleTtsRuntimeConfig', () => {
  it('has no API-key field and ignores GOOGLE_TTS_API_KEY', () => {
    const config = resolveGoogleTtsRuntimeConfig(env({ GOOGLE_TTS_API_KEY: 'AIza-old' }));
    expect(config).not.toHaveProperty('apiKey');
    expect(config.credentialsJson).toBeUndefined();
  });

  it('GOOGLE_CLOUD_PROJECT_ID is optional and falls back to the JSON project_id', () => {
    expect(resolveGoogleTtsRuntimeConfig(env({ GOOGLE_TTS_CREDENTIALS_JSON: CREDS })).projectId).toBe('json-project');
    expect(
      resolveGoogleTtsRuntimeConfig(env({ GOOGLE_TTS_CREDENTIALS_JSON: CREDS, GOOGLE_CLOUD_PROJECT_ID: 'explicit' })).projectId
    ).toBe('explicit');
  });
});

describe('createGoogleTtsProvider', () => {
  it('creates Gemini provider by default', () => {
    const config = resolveGoogleTtsRuntimeConfig(env({ GOOGLE_TTS_CREDENTIALS_JSON: CREDS }));

    expect(config.provider).toBe('gemini');
    expect(config.cacheSuffix).toContain('gemini-2.5-flash-tts:Leda:');
    expect(createGoogleTtsProvider(config, env({ NARRATION_ALIGNER: 'google' }))).toBeInstanceOf(GeminiFlashTtsProvider);
  });

  it('creates Neural2 provider when requested', () => {
    const config = resolveGoogleTtsRuntimeConfig(env({
      GOOGLE_TTS_CREDENTIALS_JSON: CREDS,
      GOOGLE_TTS_PROVIDER: 'neural2',
      GOOGLE_TTS_VOICE: 'pt-BR-Neural2-C',
    }));

    expect(config.cacheSuffix).toBe('pt-BR-Neural2-C');
    expect(createGoogleTtsProvider(config)).toBeInstanceOf(GoogleTtsProvider);
  });
});

describe('selectTtsProvider', () => {
  it('TTS_USE_STUB=true → stub', () => {
    const e = env({ TTS_USE_STUB: 'true', GOOGLE_TTS_CREDENTIALS_JSON: CREDS });
    expect(selectTtsProvider(resolveGoogleTtsRuntimeConfig(e), e)).toBeInstanceOf(StubTtsProvider);
  });

  it('service account JSON present → Google provider', () => {
    const e = env({ GOOGLE_TTS_CREDENTIALS_JSON: CREDS });
    expect(selectTtsProvider(resolveGoogleTtsRuntimeConfig(e), e)).toBeInstanceOf(GeminiFlashTtsProvider);
  });

  it('only GOOGLE_TTS_API_KEY (no JSON) → unconfigured provider with a clear message at narration time', async () => {
    const e = env({ GOOGLE_TTS_API_KEY: 'AIza-old' });
    const provider = selectTtsProvider(resolveGoogleTtsRuntimeConfig(e), e);
    expect(provider).toBeInstanceOf(UnconfiguredTtsProvider);
    await expect(provider.generateSpeechWithTimestamps!({ text: 'Oi', blockKey: 'b' })).rejects.toMatchObject({
      code: 'TTS_NOT_CONFIGURED',
      message: 'Narração não configurada: falta GOOGLE_TTS_CREDENTIALS_JSON.',
    });
    await expect(provider.generateSpeech({ text: 'Oi', blockKey: 'b' })).rejects.toMatchObject({
      code: 'TTS_NOT_CONFIGURED',
    });
  });
});

describe('importing the container (build time) never throws', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('GOOGLE_CLOUD_PROJECT_ID', '');
    vi.stubEnv('GOOGLE_TTS_CREDENTIALS_JSON', '');
    vi.stubEnv('TTS_USE_STUB', 'false');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('without GOOGLE_TTS_CREDENTIALS_JSON', async () => {
    await expect(import('@/lib/container')).resolves.toBeDefined();
  });

  it('with the JSON but without GOOGLE_CLOUD_PROJECT_ID', async () => {
    vi.stubEnv('GOOGLE_TTS_CREDENTIALS_JSON', CREDS);
    await expect(import('@/lib/container')).resolves.toBeDefined();
  });

  it('with Groq selected but without GROQ_API_KEY', async () => {
    vi.stubEnv('GOOGLE_TTS_CREDENTIALS_JSON', CREDS);
    vi.stubEnv('NARRATION_ALIGNER', 'groq');
    vi.stubEnv('GROQ_API_KEY', '');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(import('@/lib/container')).resolves.toBeDefined();
    warnSpy.mockRestore();
  });
});
