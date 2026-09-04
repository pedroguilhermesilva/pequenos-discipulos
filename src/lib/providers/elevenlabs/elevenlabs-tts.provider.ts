import { DomainError } from '@/lib/domain/errors';
import { parseElevenLabsError } from '@/lib/providers/elevenlabs/parse-elevenlabs-error';
import type {
  TtsGenerateParams,
  TtsGenerateResult,
  TtsGenerateWithTimestampsResult,
  TtsProvider,
} from '@/lib/providers/interfaces/tts.provider';

export interface ElevenLabsTtsConfig {
  apiKey: string;
  baseUrl: string;
  voiceId: string;
  model: string;
}

export class ElevenLabsTtsProvider implements TtsProvider {
  constructor(private readonly config: ElevenLabsTtsConfig) {}

  async generateSpeech(params: TtsGenerateParams): Promise<TtsGenerateResult> {
    const result = await this.requestSpeech(params, false);
    return {
      buffer: result.buffer,
      contentType: result.contentType,
      durationMs: result.durationMs,
    };
  }

  async generateSpeechWithTimestamps(
    params: TtsGenerateParams
  ): Promise<TtsGenerateWithTimestampsResult> {
    return this.requestSpeech(params, true);
  }

  private async requestSpeech(
    params: TtsGenerateParams,
    withTimestamps: boolean
  ): Promise<TtsGenerateWithTimestampsResult> {
    const baseUrl = this.config.baseUrl.replace(/\/$/, '');
    const suffix = withTimestamps ? '/with-timestamps' : '';
    const query = withTimestamps ? '' : '?output_format=mp3_44100_128';
    const url = `${baseUrl}/text-to-speech/${this.config.voiceId}${suffix}${query}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': this.config.apiKey,
      },
      body: JSON.stringify({
        text: params.text,
        model_id: this.config.model,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new DomainError(
        'TTS_NOT_CONFIGURED',
        parseElevenLabsError(response.status, errorBody)
      );
    }

    if (withTimestamps) {
      const payload = (await response.json()) as {
        audio_base64?: string;
        alignment?: {
          characters: string[];
          character_start_times_seconds: number[];
          character_end_times_seconds: number[];
        };
      };

      if (!payload.audio_base64) {
        throw new DomainError('TTS_NOT_CONFIGURED', 'ElevenLabs devolveu narração sem áudio.');
      }

      const buffer = Buffer.from(payload.audio_base64, 'base64');
      const alignment = payload.alignment
        ? {
            characters: payload.alignment.characters,
            characterStartTimesSeconds: payload.alignment.character_start_times_seconds,
            characterEndTimesSeconds: payload.alignment.character_end_times_seconds,
          }
        : undefined;

      const durationMs = alignment?.characterEndTimesSeconds.length
        ? Math.round(
            (alignment.characterEndTimesSeconds[alignment.characterEndTimesSeconds.length - 1] ??
              0) * 1000
          )
        : undefined;

      return { buffer, contentType: 'audio/mpeg', durationMs, alignment };
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return { buffer, contentType: 'audio/mpeg' };
  }
}
