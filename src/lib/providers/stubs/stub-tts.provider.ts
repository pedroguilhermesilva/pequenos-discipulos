import { DomainError } from '@/lib/domain/errors';
import type {
  TtsGenerateParams,
  TtsGenerateResult,
  TtsGenerateWithTimestampsResult,
  TtsProvider,
} from '@/lib/providers/interfaces/tts.provider';

function silentWavBuffer(): Buffer {
  return Buffer.from([
    0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
    0x66, 0x6d, 0x74, 0x20, 0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
    0x44, 0xac, 0x00, 0x00, 0x88, 0x58, 0x01, 0x00, 0x02, 0x00, 0x10, 0x00,
    0x64, 0x61, 0x74, 0x61, 0x00, 0x00, 0x00, 0x00,
  ]);
}

function buildStubAlignment(text: string) {
  const characters = [...text];
  const characterStartTimesSeconds: number[] = [];
  const characterEndTimesSeconds: number[] = [];

  characters.forEach((_, index) => {
    characterStartTimesSeconds.push(index * 0.08);
    characterEndTimesSeconds.push((index + 1) * 0.08);
  });

  return { characters, characterStartTimesSeconds, characterEndTimesSeconds };
}

/**
 * Minimal silent WAV stub so audio wiring works without TTS credentials.
 */
export class StubTtsProvider implements TtsProvider {
  async generateSpeech(params: TtsGenerateParams): Promise<TtsGenerateResult> {
    void params;
    return { buffer: silentWavBuffer(), contentType: 'audio/wav', durationMs: 100 };
  }

  async generateSpeechWithTimestamps(
    params: TtsGenerateParams
  ): Promise<TtsGenerateWithTimestampsResult> {
    const alignment = buildStubAlignment(params.text);
    const durationMs = Math.round(
      (alignment.characterEndTimesSeconds[alignment.characterEndTimesSeconds.length - 1] ?? 0.5) *
        1000
    );
    return {
      buffer: silentWavBuffer(),
      contentType: 'audio/wav',
      durationMs,
      alignment,
    };
  }
}

export class UnconfiguredTtsProvider implements TtsProvider {
  async generateSpeech(): Promise<TtsGenerateResult> {
    throw new DomainError('TTS_NOT_CONFIGURED', 'TTS_API_KEY não configurada.');
  }
}
