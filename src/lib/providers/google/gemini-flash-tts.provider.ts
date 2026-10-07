import { DomainError } from '@/lib/domain/errors';
import { resolveGoogleTtsAuthorization } from '@/lib/providers/google/google-tts-auth';
import { alignAudioToText } from '@/lib/providers/google/google-speech-alignment';
import { parseGoogleTtsError } from '@/lib/providers/google/parse-google-tts-error';
import { tokenizeNarrationWords } from '@/lib/providers/google/google-tts-ssml';
import type {
  TtsGenerateParams,
  TtsGenerateResult,
  TtsGenerateWithTimestampsResult,
  TtsProvider,
} from '@/lib/providers/interfaces/tts.provider';

const SYNTHESIZE_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';

export interface GeminiFlashTtsConfig {
  apiKey?: string;
  credentialsJson?: string;
  projectId: string;
  modelName: string;
  voiceName: string;
  languageCode: string;
  stylePrompt: string;
}

type GoogleSynthesizeResponse = {
  audioContent?: string;
};

export class GeminiFlashTtsProvider implements TtsProvider {
  constructor(private readonly config: GeminiFlashTtsConfig) {}

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
    const { alignment, strategy } = await alignAudioToText(params.text, result.buffer, {
      apiKey: this.config.apiKey,
      credentialsJson: this.config.credentialsJson,
      projectId: this.config.projectId,
      languageCode: this.config.languageCode,
    });

    if (strategy !== 'speech-to-text') {
      console.warn(`[GeminiFlashTts] Alinhamento via ${strategy} para bloco ${params.blockKey}.`);
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
    const auth = await resolveGoogleTtsAuthorization(
      this.config.apiKey,
      this.config.credentialsJson,
      this.config.projectId
    );

    const response = await fetch(`${SYNTHESIZE_URL}${auth.urlSuffix}`, {
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
