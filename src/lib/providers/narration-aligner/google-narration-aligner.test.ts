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
});
