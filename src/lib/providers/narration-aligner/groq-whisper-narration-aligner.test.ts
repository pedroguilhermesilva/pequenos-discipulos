import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GroqWhisperNarrationAligner } from '@/lib/providers/narration-aligner/groq-whisper-narration-aligner';

describe('GroqWhisperNarrationAligner', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls Groq Whisper with word timestamp granularities in pt', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        words: [
          { word: 'Olá', start: 0, end: 0.4 },
          { word: 'Deus', start: 0.4, end: 0.9 },
        ],
      }),
    });

    const aligner = new GroqWhisperNarrationAligner({ apiKey: 'gsk-test' });
    const result = await aligner.align({
      text: 'Olá Deus',
      audioBuffer: Buffer.from('audio'),
      contentType: 'audio/mpeg',
      languageCode: 'pt-BR',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.groq.com/openai/v1/audio/transcriptions');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer gsk-test' });
    expect(init.body).toBeInstanceOf(FormData);

    const form = init.body as FormData;
    expect(form.get('model')).toBe('whisper-large-v3-turbo');
    expect(form.get('response_format')).toBe('verbose_json');
    expect(form.get('timestamp_granularities[]')).toBe('word');
    expect(form.get('language')).toBe('pt');

    expect(result.provider).toBe('groq');
    expect(result.strategy).toBe('provider');
    expect(result.alignment?.words).toEqual(['Olá', 'Deus']);
  });

  it('falls back to estimated timings when Groq responds with an error', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'invalid api key',
    });

    const aligner = new GroqWhisperNarrationAligner({ apiKey: 'bad-key' });
    const result = await aligner.align({
      text: 'Olá Deus',
      audioBuffer: Buffer.from('audio'),
      contentType: 'audio/mpeg',
      languageCode: 'pt-BR',
    });

    expect(result.strategy).toBe('estimated');
    expect(result.alignment?.words).toEqual(['Olá', 'Deus']);
    errorSpy.mockRestore();
  });
});
