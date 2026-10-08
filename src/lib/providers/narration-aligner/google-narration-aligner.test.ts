import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GoogleNarrationAligner } from '@/lib/providers/narration-aligner/google-narration-aligner';

describe('GoogleNarrationAligner', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses estimated timings for long audio without calling Speech-to-Text', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const longAudio = Buffer.alloc(900_000);
    const aligner = new GoogleNarrationAligner({
      apiKey: 'test-key',
      projectId: 'demo-project',
      languageCode: 'pt-BR',
    });

    const result = await aligner.align({
      text: 'Um dois três',
      audioBuffer: longAudio,
      contentType: 'audio/mpeg',
      languageCode: 'pt-BR',
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.strategy).toBe('estimated');
    expect(result.alignment?.words).toEqual(['Um', 'dois', 'três']);
    warnSpy.mockRestore();
  });

  it('returns provider alignment from Speech-to-Text word offsets', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            alternatives: [
              {
                words: [
                  { word: 'Olá', startOffset: '0s', endOffset: '0.4s' },
                  { word: 'Deus', startOffset: '0.4s', endOffset: '0.9s' },
                ],
              },
            ],
          },
        ],
      }),
    });

    const aligner = new GoogleNarrationAligner({
      apiKey: 'test-key',
      projectId: 'demo-project',
      languageCode: 'pt-BR',
    });

    const result = await aligner.align({
      text: 'Olá Deus',
      audioBuffer: Buffer.from('audio'),
      contentType: 'audio/mpeg',
      languageCode: 'pt-BR',
    });

    expect(result.provider).toBe('google');
    expect(result.strategy).toBe('provider');
    expect(result.alignment?.words).toEqual(['Olá', 'Deus']);
  });

  it('falls back to estimated timings with a clear Portuguese error when project ID is missing (call time only)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const aligner = new GoogleNarrationAligner({ apiKey: 'test-key', languageCode: 'pt-BR' });

    const result = await aligner.align({
      text: 'Olá Deus',
      audioBuffer: Buffer.from('audio'),
      contentType: 'audio/mpeg',
      languageCode: 'pt-BR',
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.strategy).toBe('estimated');
    expect(result.alignment?.words).toEqual(['Olá', 'Deus']);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('GOOGLE_CLOUD_PROJECT_ID'));
    errorSpy.mockRestore();
  });

  it('prefers the service account (Bearer + x-goog-user-project) over the API key', async () => {
    const { generateKeyPairSync } = await import('node:crypto');
    const { resetGoogleTtsAuthCacheForTests } = await import('@/lib/providers/google/google-tts-auth');
    resetGoogleTtsAuthCacheForTests();
    const pem = generateKeyPairSync('rsa', { modulusLength: 2048 })
      .privateKey.export({ type: 'pkcs8', format: 'pem' })
      .toString();
    const credentialsJson = JSON.stringify(
      { project_id: 'tts-test-507913', client_email: 'sa@tts-test-507913.iam.gserviceaccount.com', private_key: pem },
      null,
      2
    );

    fetchMock.mockImplementation(async (url: string) => {
      if (url.startsWith('https://oauth2.googleapis.com/token')) {
        return { ok: true, json: async () => ({ access_token: 'ya29.sa', expires_in: 3600 }) };
      }
      return {
        ok: true,
        json: async () => ({
          results: [{ alternatives: [{ words: [
            { word: 'Olá', startOffset: '0s', endOffset: '0.4s' },
            { word: 'Deus', startOffset: '0.4s', endOffset: '0.9s' },
          ] }] }],
        }),
      };
    });

    const aligner = new GoogleNarrationAligner({
      apiKey: 'test-key',
      credentialsJson,
      languageCode: 'pt-BR',
    });

    const result = await aligner.align({
      text: 'Olá Deus',
      audioBuffer: Buffer.from('audio'),
      contentType: 'audio/mpeg',
      languageCode: 'pt-BR',
    });

    expect(result.strategy).toBe('provider');
    const sttCall = fetchMock.mock.calls.find(([url]) => String(url).includes('speech.googleapis.com'));
    expect(sttCall).toBeDefined();
    const [sttUrl, sttInit] = sttCall as [string, RequestInit];
    expect(sttUrl).toContain('/projects/tts-test-507913/');
    expect(sttUrl).not.toContain('key=');
    const headers = sttInit.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer ya29.sa');
    expect(headers['x-goog-user-project']).toBe('tts-test-507913');
    resetGoogleTtsAuthCacheForTests();
  });
});
