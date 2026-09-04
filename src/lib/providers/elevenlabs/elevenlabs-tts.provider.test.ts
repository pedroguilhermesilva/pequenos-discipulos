import { describe, expect, it, vi, afterEach } from 'vitest';
import { ElevenLabsTtsProvider } from '@/lib/providers/elevenlabs/elevenlabs-tts.provider';

describe('ElevenLabsTtsProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests speech audio from ElevenLabs', async () => {
    const audioBytes = new Uint8Array([1, 2, 3, 4]);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => audioBytes.buffer,
      })
    );

    const provider = new ElevenLabsTtsProvider({
      apiKey: 'test-key',
      baseUrl: 'https://api.elevenlabs.io/v1',
      voiceId: 'voice-123',
      model: 'eleven_multilingual_v2',
    });

    const result = await provider.generateSpeech({
      text: 'estrela',
      blockKey: 'p0-par0-part1',
    });

    expect(result.contentType).toBe('audio/mpeg');
    expect(result.buffer).toEqual(Buffer.from(audioBytes));
    expect(fetch).toHaveBeenCalledWith(
      'https://api.elevenlabs.io/v1/text-to-speech/voice-123?output_format=mp3_44100_128',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'xi-api-key': 'test-key',
        }),
      })
    );
  });
});
