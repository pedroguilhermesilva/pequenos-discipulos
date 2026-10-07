import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GoogleTtsProvider } from '@/lib/providers/google/google-tts.provider';

describe('GoogleTtsProvider', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls text:synthesize with SSML marks and enableTimePointing', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        audioContent: Buffer.from('audio').toString('base64'),
        timepoints: [
          { markName: 'w0', timeSeconds: 0 },
          { markName: 'w1', timeSeconds: 0.5 },
          { markName: 'end', timeSeconds: 1.1 },
        ],
      }),
    });

    const provider = new GoogleTtsProvider({
      apiKey: 'test-key',
      voiceName: 'pt-BR-Neural2-C',
      languageCode: 'pt-BR',
    });

    const result = await provider.generateSpeechWithTimestamps({
      text: 'Olá Deus',
      blockKey: 'story-narration',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=test-key'
    );

    const body = JSON.parse(String(init.body)) as {
      input: { ssml: string };
      enableTimePointing: string[];
      voice: { name: string; languageCode: string };
    };

    expect(body.enableTimePointing).toEqual(['SSML_MARK']);
    expect(body.input.ssml).toContain('<mark name="w0"/>Olá <mark name="w1"/>Deus');
    expect(body.voice).toEqual({
      languageCode: 'pt-BR',
      name: 'pt-BR-Neural2-C',
    });
    expect(result.alignment?.words).toEqual(['Olá', 'Deus']);
    expect(result.contentType).toBe('audio/mpeg');
    expect(result.durationMs).toBe(1100);
  });

  it('uses plain text for generateSpeech without timestamps', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        audioContent: Buffer.from('audio').toString('base64'),
      }),
    });

    const provider = new GoogleTtsProvider({
      apiKey: 'test-key',
      voiceName: 'pt-BR-Neural2-C',
      languageCode: 'pt-BR',
    });

    await provider.generateSpeech({
      text: 'Coragem!',
      blockKey: 'p0-par0-part1',
    });

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as {
      input: { text: string };
      enableTimePointing?: string[];
    };

    expect(body.input.text).toBe('Coragem!');
    expect(body.enableTimePointing).toBeUndefined();
  });

  it('throws a domain error when Google responds with 403', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => 'PERMISSION_DENIED',
    });

    const provider = new GoogleTtsProvider({
      apiKey: 'bad-key',
      voiceName: 'pt-BR-Neural2-C',
      languageCode: 'pt-BR',
    });

    await expect(
      provider.generateSpeechWithTimestamps({ text: 'Teste', blockKey: 'story-narration' })
    ).rejects.toMatchObject({
      code: 'TTS_NOT_CONFIGURED',
    });
  });
});
