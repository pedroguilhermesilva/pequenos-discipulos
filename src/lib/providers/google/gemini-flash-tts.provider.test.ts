import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/providers/google/google-tts-auth', () => ({
  MISSING_CREDENTIALS_MESSAGE: 'Narração não configurada: falta GOOGLE_TTS_CREDENTIALS_JSON.',
  resolveGoogleTtsAuthorization: vi.fn(async () => ({
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ya29.test',
      'x-goog-user-project': 'demo-project',
    },
  })),
}));

import { resolveGoogleTtsAuthorization } from '@/lib/providers/google/google-tts-auth';
import { GeminiFlashTtsProvider } from '@/lib/providers/google/gemini-flash-tts.provider';
import type { NarrationAligner } from '@/lib/providers/interfaces/narration-aligner';

function createAlignerStub(result: Awaited<ReturnType<NarrationAligner['align']>>): NarrationAligner {
  return {
    id: 'stub',
    align: vi.fn().mockResolvedValue(result),
  };
}

const CREDS = '{"client_email":"sa@x.iam.gserviceaccount.com","private_key":"k","project_id":"demo-project"}';

function provider(aligner: NarrationAligner, overrides: Partial<ConstructorParameters<typeof GeminiFlashTtsProvider>[0]> = {}) {
  return new GeminiFlashTtsProvider(
    {
      credentialsJson: CREDS,
      modelName: 'gemini-2.5-flash-tts',
      voiceName: 'Leda',
      languageCode: 'pt-BR',
      stylePrompt: 'Narradora calorosa para crianças.',
      ...overrides,
    },
    aligner
  );
}

describe('GeminiFlashTtsProvider', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    vi.mocked(resolveGoogleTtsAuthorization).mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls Cloud TTS v1 with the service-account token, prompt and modelName, then delegates alignment', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ audioContent: Buffer.from('audio').toString('base64') }),
    });

    const aligner = createAlignerStub({
      provider: 'google',
      strategy: 'provider',
      alignment: {
        words: ['Olá', 'Deus'],
        wordStartTimesSeconds: [0, 0.4],
        wordEndTimesSeconds: [0.4, 0.9],
        wordCharStarts: [0, 4],
        wordCharEnds: [3, 8],
      },
    });

    const result = await provider(aligner, { projectId: 'demo-project' }).generateSpeechWithTimestamps({
      text: 'Olá Deus',
      blockKey: 'story-narration',
    });

    expect(resolveGoogleTtsAuthorization).toHaveBeenCalledWith(CREDS, 'demo-project');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [ttsUrl, ttsInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(ttsUrl).toBe('https://texttospeech.googleapis.com/v1/text:synthesize');
    expect(ttsUrl).not.toContain('key=');
    const headers = ttsInit.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer ya29.test');
    expect(headers['x-goog-user-project']).toBe('demo-project');

    const ttsBody = JSON.parse(String(ttsInit.body)) as {
      input: { text: string; prompt: string };
      voice: { name: string; languageCode: string; modelName: string };
    };
    expect(ttsBody.input).toEqual({ text: 'Olá Deus', prompt: 'Narradora calorosa para crianças.' });
    expect(ttsBody.voice).toEqual({ languageCode: 'pt-BR', name: 'Leda', modelName: 'gemini-2.5-flash-tts' });
    expect(aligner.align).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Olá Deus', contentType: 'audio/mpeg', languageCode: 'pt-BR' })
    );
    expect(result.alignment?.words).toEqual(['Olá', 'Deus']);
    expect(result.contentType).toBe('audio/mpeg');
  });

  it('returns audio with estimated alignment when aligner falls back', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ audioContent: Buffer.from('audio').toString('base64') }),
    });

    const aligner = createAlignerStub({
      provider: 'google',
      strategy: 'estimated',
      alignment: {
        words: ['Olá', 'Deus'],
        wordStartTimesSeconds: [0, 0.35],
        wordEndTimesSeconds: [0.35, 0.7],
        wordCharStarts: [0, 4],
        wordCharEnds: [3, 8],
      },
    });

    const result = await provider(aligner).generateSpeechWithTimestamps({ text: 'Olá Deus', blockKey: 'story-narration' });

    expect(result.buffer.length).toBeGreaterThan(0);
    expect(result.alignment?.words).toEqual(['Olá', 'Deus']);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('logs Google status/reason/message server-side and throws a specific message', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      text: async () =>
        JSON.stringify({
          error: {
            code: 403,
            status: 'PERMISSION_DENIED',
            message: 'Cloud Text-to-Speech API has not been used in project 123 before or it is disabled.',
            details: [{ '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason: 'SERVICE_DISABLED' }],
          },
        }),
    });

    await expect(
      provider(createAlignerStub({ provider: 'stub', strategy: 'none', alignment: null })).generateSpeech({ text: 'Olá', blockKey: 'b' })
    ).rejects.toThrow(/SERVICE_DISABLED/);
    const logged = errorSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(logged).toContain('403');
    expect(logged).toContain('SERVICE_DISABLED');
    expect(logged).toContain('gemini-2.5-flash-tts');
    expect(logged).not.toContain('api-key');
    expect(logged).not.toContain('private_key');
    errorSpy.mockRestore();
  });

  it('without GOOGLE_TTS_CREDENTIALS_JSON: constructs fine, fails only when narration is requested', async () => {
    const p = provider(createAlignerStub({ provider: 'stub', strategy: 'none', alignment: null }), {
      credentialsJson: undefined,
    });
    await expect(p.generateSpeech({ text: 'Olá', blockKey: 'b' })).rejects.toMatchObject({
      code: 'TTS_NOT_CONFIGURED',
      message: expect.stringContaining('falta GOOGLE_TTS_CREDENTIALS_JSON'),
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
