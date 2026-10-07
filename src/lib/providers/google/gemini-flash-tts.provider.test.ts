import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GeminiFlashTtsProvider } from '@/lib/providers/google/gemini-flash-tts.provider';
import type { NarrationAligner } from '@/lib/providers/interfaces/narration-aligner';

function createAlignerStub(result: Awaited<ReturnType<NarrationAligner['align']>>): NarrationAligner {
  return {
    id: 'stub',
    align: vi.fn().mockResolvedValue(result),
  };
}

describe('GeminiFlashTtsProvider', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls Cloud TTS v1 with prompt and modelName, then delegates alignment', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        audioContent: Buffer.from('audio').toString('base64'),
      }),
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

    const provider = new GeminiFlashTtsProvider(
      {
        apiKey: 'test-key',
        projectId: 'demo-project',
        modelName: 'gemini-2.5-flash-tts',
        voiceName: 'Leda',
        languageCode: 'pt-BR',
        stylePrompt: 'Narradora calorosa para crianças.',
      },
      aligner
    );

    const result = await provider.generateSpeechWithTimestamps({
      text: 'Olá Deus',
      blockKey: 'story-narration',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [ttsUrl, ttsInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(ttsUrl).toBe('https://texttospeech.googleapis.com/v1/text:synthesize?key=test-key');

    const ttsBody = JSON.parse(String(ttsInit.body)) as {
      input: { text: string; prompt: string };
      voice: { name: string; languageCode: string; modelName: string };
    };

    expect(ttsBody.input).toEqual({
      text: 'Olá Deus',
      prompt: 'Narradora calorosa para crianças.',
    });
    expect(ttsBody.voice).toEqual({
      languageCode: 'pt-BR',
      name: 'Leda',
      modelName: 'gemini-2.5-flash-tts',
    });
    expect(aligner.align).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Olá Deus',
        contentType: 'audio/mpeg',
        languageCode: 'pt-BR',
      })
    );
    expect(result.alignment?.words).toEqual(['Olá', 'Deus']);
    expect(result.contentType).toBe('audio/mpeg');
  });

  it('returns audio with estimated alignment when aligner falls back', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        audioContent: Buffer.from('audio').toString('base64'),
      }),
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

    const provider = new GeminiFlashTtsProvider(
      {
        apiKey: 'test-key',
        projectId: 'demo-project',
        modelName: 'gemini-2.5-flash-tts',
        voiceName: 'Leda',
        languageCode: 'pt-BR',
        stylePrompt: 'Narradora calorosa.',
      },
      aligner
    );

    const result = await provider.generateSpeechWithTimestamps({
      text: 'Olá Deus',
      blockKey: 'story-narration',
    });

    expect(result.buffer.length).toBeGreaterThan(0);
    expect(result.alignment?.words).toEqual(['Olá', 'Deus']);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('synthesizes with API key and no project ID, without x-goog-user-project header', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ audioContent: Buffer.from('audio').toString('base64') }),
    });

    const provider = new GeminiFlashTtsProvider(
      {
        apiKey: 'test-key',
        modelName: 'gemini-2.5-flash-tts',
        voiceName: 'Leda',
        languageCode: 'pt-BR',
        stylePrompt: 'Narradora calorosa.',
      },
      createAlignerStub({ provider: 'stub', strategy: 'none', alignment: null })
    );

    const result = await provider.generateSpeech({ text: 'Olá Deus', blockKey: 'b' });

    expect(result.buffer.length).toBeGreaterThan(0);
    const [, ttsInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = ttsInit.headers as Record<string, string>;
    expect(headers['x-goog-user-project']).toBeUndefined();
  });

  it('sends x-goog-user-project header when project ID is known', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ audioContent: Buffer.from('audio').toString('base64') }),
    });

    const provider = new GeminiFlashTtsProvider(
      {
        apiKey: 'test-key',
        projectId: 'demo-project',
        modelName: 'gemini-2.5-flash-tts',
        voiceName: 'Leda',
        languageCode: 'pt-BR',
        stylePrompt: 'Narradora calorosa.',
      },
      createAlignerStub({ provider: 'stub', strategy: 'none', alignment: null })
    );

    await provider.generateSpeech({ text: 'Olá Deus', blockKey: 'b' });

    const [, ttsInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = ttsInit.headers as Record<string, string>;
    expect(headers['x-goog-user-project']).toBe('demo-project');
  });
});
