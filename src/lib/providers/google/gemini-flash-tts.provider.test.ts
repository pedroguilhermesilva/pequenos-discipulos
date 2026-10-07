import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GeminiFlashTtsProvider } from '@/lib/providers/google/gemini-flash-tts.provider';

describe('GeminiFlashTtsProvider', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls Cloud TTS v1 with prompt, modelName and post-alignment via Speech-to-Text', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          audioContent: Buffer.from('audio').toString('base64'),
        }),
      })
      .mockResolvedValueOnce({
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

    const provider = new GeminiFlashTtsProvider({
      apiKey: 'test-key',
      projectId: 'demo-project',
      modelName: 'gemini-2.5-flash-tts',
      voiceName: 'Leda',
      languageCode: 'pt-BR',
      stylePrompt: 'Narradora calorosa para crianças.',
    });

    const result = await provider.generateSpeechWithTimestamps({
      text: 'Olá Deus',
      blockKey: 'story-narration',
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);

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

    const [sttUrl, sttInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(sttUrl).toContain('/projects/demo-project/locations/global/recognizers/_:recognize');
    expect(JSON.parse(String(sttInit.body))).toMatchObject({
      config: {
        languageCodes: ['pt-BR'],
        features: { enableWordTimeOffsets: true },
      },
    });

    expect(result.alignment?.words).toEqual(['Olá', 'Deus']);
    expect(result.contentType).toBe('audio/mpeg');
  });

  it('returns audio without alignment when Speech-to-Text fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          audioContent: Buffer.from('audio').toString('base64'),
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => 'PERMISSION_DENIED',
      });

    const provider = new GeminiFlashTtsProvider({
      apiKey: 'test-key',
      projectId: 'demo-project',
      modelName: 'gemini-2.5-flash-tts',
      voiceName: 'Leda',
      languageCode: 'pt-BR',
      stylePrompt: 'Narradora calorosa.',
    });

    const result = await provider.generateSpeechWithTimestamps({
      text: 'Olá Deus',
      blockKey: 'story-narration',
    });

    expect(result.buffer.length).toBeGreaterThan(0);
    expect(result.alignment?.words).toEqual(['Olá', 'Deus']);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
