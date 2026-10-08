import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/providers/google/google-tts-auth', async (importActual) => {
  const actual = await importActual<typeof import('@/lib/providers/google/google-tts-auth')>();
  return {
    ...actual,
    resolveGoogleTtsAuthorization: vi.fn(async () => ({
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ya29.sa',
        'x-goog-user-project': 'tts-test-507913',
      },
    })),
  };
});

import { resolveGoogleTtsAuthorization } from '@/lib/providers/google/google-tts-auth';
import { GoogleNarrationAligner } from '@/lib/providers/narration-aligner/google-narration-aligner';

const CREDS_WITH_PROJECT = JSON.stringify(
  { project_id: 'tts-test-507913', client_email: 'sa@tts-test-507913.iam.gserviceaccount.com', private_key: 'k' },
  null,
  2
);
const CREDS_WITHOUT_PROJECT = JSON.stringify({ client_email: 'sa@x.iam.gserviceaccount.com', private_key: 'k' });

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
      credentialsJson: CREDS_WITH_PROJECT,
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
      credentialsJson: CREDS_WITH_PROJECT,
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
    const aligner = new GoogleNarrationAligner({ credentialsJson: CREDS_WITHOUT_PROJECT, languageCode: 'pt-BR' });

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

  it('uses the service account token and takes the project from the JSON when GOOGLE_CLOUD_PROJECT_ID is unset', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{ alternatives: [{ words: [
          { word: 'Olá', startOffset: '0s', endOffset: '0.4s' },
          { word: 'Deus', startOffset: '0.4s', endOffset: '0.9s' },
        ] }] }],
      }),
    });

    const aligner = new GoogleNarrationAligner({ credentialsJson: CREDS_WITH_PROJECT, languageCode: 'pt-BR' });
    const result = await aligner.align({
      text: 'Olá Deus',
      audioBuffer: Buffer.from('audio'),
      contentType: 'audio/mpeg',
      languageCode: 'pt-BR',
    });

    expect(result.strategy).toBe('provider');
    expect(resolveGoogleTtsAuthorization).toHaveBeenCalledWith(CREDS_WITH_PROJECT, 'tts-test-507913');
    const [sttUrl, sttInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(sttUrl).toContain('/projects/tts-test-507913/');
    expect(sttUrl).not.toContain('key=');
    const headers = sttInit.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer ya29.sa');
    expect(headers['x-goog-user-project']).toBe('tts-test-507913');
  });
});
