import { DomainError } from '@/lib/domain/errors';
import { resolveGoogleTtsAuthorization } from '@/lib/providers/google/google-tts-auth';
import { buildSsmlWithWordMarks } from '@/lib/providers/google/google-tts-ssml';
import {
  describeGoogleApiError,
  logGoogleApiError,
  parseGoogleTtsError,
} from '@/lib/providers/google/parse-google-tts-error';
import {
  timepointsToAlignment,
  type GoogleTimepoint,
} from '@/lib/providers/google/timepoints-to-alignment';
import type {
  TtsGenerateParams,
  TtsGenerateResult,
  TtsGenerateWithTimestampsResult,
  TtsProvider,
} from '@/lib/providers/interfaces/tts.provider';

const SYNTHESIZE_URL =
  'https://texttospeech.googleapis.com/v1beta1/text:synthesize';

export interface GoogleTtsConfig {
  apiKey?: string;
  credentialsJson?: string;
  voiceName: string;
  languageCode: string;
}

type GoogleSynthesizeResponse = {
  audioContent?: string;
  timepoints?: Array<{ markName?: string; timeSeconds?: number }>;
};

export class GoogleTtsProvider implements TtsProvider {
  constructor(private readonly config: GoogleTtsConfig) {}

  async generateSpeech(params: TtsGenerateParams): Promise<TtsGenerateResult> {
    const result = await this.synthesize({
      input: { text: params.text },
      enableTimePointing: undefined,
    });

    return {
      buffer: result.buffer,
      contentType: result.contentType,
      durationMs: result.durationMs,
    };
  }

  async generateSpeechWithTimestamps(
    params: TtsGenerateParams
  ): Promise<TtsGenerateWithTimestampsResult> {
    const { ssml, words } = buildSsmlWithWordMarks(params.text);
    const result = await this.synthesize({
      input: { ssml },
      enableTimePointing: ['SSML_MARK'],
    });

    const timepoints: GoogleTimepoint[] = (result.timepoints ?? [])
      .filter((point) => point.markName != null && point.timeSeconds != null)
      .map((point) => ({
        markName: point.markName!,
        timeSeconds: point.timeSeconds!,
      }));

    const alignment = timepointsToAlignment(words, timepoints);

    return {
      buffer: result.buffer,
      contentType: result.contentType,
      durationMs: result.durationMs,
      alignment,
    };
  }

  private async synthesize(options: {
    input: { text?: string; ssml?: string };
    enableTimePointing?: ['SSML_MARK'];
  }): Promise<{
    buffer: Buffer;
    contentType: string;
    durationMs?: number;
    timepoints?: GoogleSynthesizeResponse['timepoints'];
  }> {
    const auth = await resolveGoogleTtsAuthorization(
      this.config.apiKey,
      this.config.credentialsJson
    );

    const response = await fetch(`${SYNTHESIZE_URL}${auth.urlSuffix}`, {
      method: 'POST',
      headers: auth.headers,
      body: JSON.stringify({
        input: options.input,
        voice: {
          languageCode: this.config.languageCode,
          name: this.config.voiceName,
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 0.95,
          pitch: 1.5,
        },
        enableTimePointing: options.enableTimePointing,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      logGoogleApiError(
        'GoogleTts',
        describeGoogleApiError(response.status, errorBody),
        { voice: this.config.voiceName, auth: auth.mode }
      );
      throw new DomainError(
        'TTS_NOT_CONFIGURED',
        parseGoogleTtsError(response.status, errorBody)
      );
    }

    const payload = (await response.json()) as GoogleSynthesizeResponse;

    if (!payload.audioContent) {
      throw new DomainError('TTS_NOT_CONFIGURED', 'Google TTS devolveu narração sem áudio.');
    }

    const buffer = Buffer.from(payload.audioContent, 'base64');
    const endMark = payload.timepoints?.find((point) => point.markName === 'end')?.timeSeconds;
    const durationMs =
      endMark != null ? Math.round(endMark * 1000) : undefined;

    return {
      buffer,
      contentType: 'audio/mpeg',
      durationMs,
      timepoints: payload.timepoints,
    };
  }
}
