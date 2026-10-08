import { DomainError } from '@/lib/domain/errors';
import {
  MISSING_CREDENTIALS_MESSAGE,
  resolveGoogleTtsAuthorization,
} from '@/lib/providers/google/google-tts-auth';
import {
  describeGoogleApiError,
  logGoogleApiError,
  parseGoogleTtsError,
} from '@/lib/providers/google/parse-google-tts-error';
import { tokenizeNarrationWords } from '@/lib/providers/google/google-tts-ssml';
import type { NarrationAligner } from '@/lib/providers/interfaces/narration-aligner';
import type {
  TtsGenerateParams,
  TtsGenerateResult,
  TtsGenerateWithTimestampsResult,
  TtsProvider,
} from '@/lib/providers/interfaces/tts.provider';

const SYNTHESIZE_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';

export interface GeminiFlashTtsConfig {
  /** JSON da service account (GOOGLE_TTS_CREDENTIALS_JSON). Validado só ao sintetizar. */
  credentialsJson?: string;
  /** Opcional: só enviado em x-goog-user-project quando conhecido. */
  projectId?: string;
  modelName: string;
  voiceName: string;
  languageCode: string;
  stylePrompt: string;
}

type GoogleSynthesizeResponse = {
  audioContent?: string;
};

export class GeminiFlashTtsProvider implements TtsProvider {
  constructor(
    private readonly config: GeminiFlashTtsConfig,
    private readonly narrationAligner: NarrationAligner
  ) {}

  async generateSpeech(params: TtsGenerateParams): Promise<TtsGenerateResult> {
    const result = await this.synthesize(params.text);
    return {
      buffer: result.buffer,
      contentType: result.contentType,
      durationMs: result.durationMs,
    };
  }

  async generateSpeechWithTimestamps(
    params: TtsGenerateParams
  ): Promise<TtsGenerateWithTimestampsResult> {
    const result = await this.synthesize(params.text);
    const { alignment, strategy, provider } = await this.narrationAligner.align({
      text: params.text,
      audioBuffer: result.buffer,
      contentType: result.contentType,
      languageCode: this.config.languageCode,
    });

    if (strategy !== 'provider') {
      console.warn(
        `[GeminiFlashTts] Alinhamento via ${strategy} (${provider}) para bloco ${params.blockKey}.`
      );
    }

    return {
      buffer: result.buffer,
      contentType: result.contentType,
      durationMs: result.durationMs,
      alignment: alignment ?? undefined,
    };
  }

  private async synthesize(text: string): Promise<{
    buffer: Buffer;
    contentType: string;
    durationMs?: number;
  }> {
    if (!this.config.credentialsJson?.trim()) {
      throw new DomainError('TTS_NOT_CONFIGURED', MISSING_CREDENTIALS_MESSAGE);
    }
    const auth = await resolveGoogleTtsAuthorization(this.config.credentialsJson, this.config.projectId);

    const response = await fetch(SYNTHESIZE_URL, {
      method: 'POST',
      headers: auth.headers,
      body: JSON.stringify({
        input: {
          text,
          prompt: this.config.stylePrompt,
        },
        voice: {
          languageCode: this.config.languageCode,
          name: this.config.voiceName,
          modelName: this.config.modelName,
        },
        audioConfig: {
          audioEncoding: 'MP3',
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      logGoogleApiError(
        'GeminiFlashTts',
        describeGoogleApiError(response.status, errorBody),
        { model: this.config.modelName, voice: this.config.voiceName }
      );
      throw new DomainError(
        'TTS_NOT_CONFIGURED',
        parseGoogleTtsError(response.status, errorBody)
      );
    }

    const payload = (await response.json()) as GoogleSynthesizeResponse;
    if (!payload.audioContent) {
      throw new DomainError('TTS_NOT_CONFIGURED', 'Google Gemini TTS devolveu narração sem áudio.');
    }

    const buffer = Buffer.from(payload.audioContent, 'base64');
    const wordCount = tokenizeNarrationWords(text).length;
    const durationMs = Math.round(Math.max(wordCount * 0.35, 1) * 1000);

    return {
      buffer,
      contentType: 'audio/mpeg',
      durationMs,
    };
  }
}
