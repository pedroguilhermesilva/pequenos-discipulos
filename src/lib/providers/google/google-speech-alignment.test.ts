import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { alignAudioToText } from '@/lib/providers/google/google-speech-alignment';

describe('alignAudioToText', () => {
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

    const result = await alignAudioToText('Um dois três', longAudio, {
      apiKey: 'test-key',
      projectId: 'demo-project',
      languageCode: 'pt-BR',
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.strategy).toBe('estimated');
    expect(result.alignment?.words).toEqual(['Um', 'dois', 'três']);
    warnSpy.mockRestore();
  });
});
