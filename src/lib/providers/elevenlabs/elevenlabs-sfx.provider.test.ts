import { describe, expect, it, vi, afterEach } from 'vitest';
import { ElevenLabsSfxProvider } from '@/lib/providers/elevenlabs/elevenlabs-sfx.provider';

describe('ElevenLabsSfxProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests sound effects from ElevenLabs', async () => {
    const audioBytes = new Uint8Array([5, 6, 7, 8]);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => audioBytes.buffer,
      })
    );

    const provider = new ElevenLabsSfxProvider({
      apiKey: 'test-key',
      baseUrl: 'https://api.elevenlabs.io/v1',
      model: 'eleven_text_to_sound_v2',
    });

    const result = await provider.generateSound({
      prompt: 'gentle magical star twinkle',
      blockKey: 'p0-par0-part2',
      durationSeconds: 2,
    });

    expect(result.contentType).toBe('audio/mpeg');
    expect(result.durationMs).toBe(2000);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'xi-api-key': 'test-key',
        }),
      })
    );
  });
});
