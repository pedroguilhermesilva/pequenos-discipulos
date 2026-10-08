import { DomainError } from '@/lib/domain/errors';
import type {
  TtsGenerateParams,
  TtsGenerateResult,
  TtsGenerateWithTimestampsResult,
  TtsProvider,
} from '@/lib/providers/interfaces/tts.provider';
import { tokenizeNarrationWords } from '@/lib/providers/google/google-tts-ssml';

function silentWavBuffer(): Buffer {
  return Buffer.from([
    0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
    0x66, 0x6d, 0x74, 0x20, 0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
    0x44, 0xac, 0x00, 0x00, 0x88, 0x58, 0x01, 0x00, 0x02, 0x00, 0x10, 0x00,
    0x64, 0x61, 0x74, 0x61, 0x00, 0x00, 0x00, 0x00,
  ]);
}

function buildStubAlignment(text: string) {
  const tokens = tokenizeNarrationWords(text);
  const words: string[] = [];
  const wordStartTimesSeconds: number[] = [];
  const wordEndTimesSeconds: number[] = [];
  const wordCharStarts: number[] = [];
  const wordCharEnds: number[] = [];

  tokens.forEach((token, index) => {
    words.push(token.text);
    wordStartTimesSeconds.push(index * 0.35);
    wordEndTimesSeconds.push((index + 1) * 0.35);
    wordCharStarts.push(token.charStart);
    wordCharEnds.push(token.charEnd);
  });

  return {
    words,
    wordStartTimesSeconds,
    wordEndTimesSeconds,
    wordCharStarts,
    wordCharEnds,
  };
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
      (alignment.wordEndTimesSeconds[alignment.wordEndTimesSeconds.length - 1] ?? 0.5) * 1000
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
  constructor(private readonly message = 'TTS não configurado.') {}

  async generateSpeech(): Promise<TtsGenerateResult> {
    throw new DomainError('TTS_NOT_CONFIGURED', this.message);
  }

  async generateSpeechWithTimestamps(): Promise<TtsGenerateWithTimestampsResult> {
    throw new DomainError('TTS_NOT_CONFIGURED', this.message);
  }
}
