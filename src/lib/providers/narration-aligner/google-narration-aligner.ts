import { estimateAlignmentFromDuration } from '@/lib/providers/google/estimate-alignment';
import { parseGoogleDurationSeconds } from '@/lib/providers/google/parse-google-duration';
import {
  matchTranscriptionToText,
  type TranscribedWord,
} from '@/lib/providers/google/match-transcription-words';
import { resolveGoogleTtsAuthorization } from '@/lib/providers/google/google-tts-auth';
import { tokenizeNarrationWords } from '@/lib/providers/google/google-tts-ssml';
import type {
  NarrationAligner,
  NarrationAlignInput,
  NarrationAlignResult,
} from '@/lib/providers/interfaces/narration-aligner';
import { estimateMp3DurationSeconds } from '@/lib/providers/narration-aligner/estimate-audio-duration';

const SPEECH_SYNC_MAX_SECONDS = 55;

export type GoogleNarrationAlignerConfig = {
  apiKey?: string;
  credentialsJson?: string;
  /** Obrigatório só no momento do alinhamento (Speech-to-Text v2 usa o projeto no URL). */
  projectId?: string;
  languageCode: string;
};

type SpeechRecognizeResponse = {
  results?: Array<{
    alternatives?: Array<{
      words?: Array<{
        word?: string;
        startOffset?: string;
        endOffset?: string;
      }>;
    }>;
  }>;
};

function extractTranscribedWords(payload: SpeechRecognizeResponse): TranscribedWord[] {
  const words: TranscribedWord[] = [];

  for (const result of payload.results ?? []) {
    for (const alternative of result.alternatives ?? []) {
      for (const wordInfo of alternative.words ?? []) {
        if (!wordInfo.word) continue;
        words.push({
          word: wordInfo.word,
          startSeconds: parseGoogleDurationSeconds(wordInfo.startOffset),
          endSeconds: parseGoogleDurationSeconds(wordInfo.endOffset),
        });
      }
    }
  }

  return words;
}

export class GoogleNarrationAligner implements NarrationAligner {
  readonly id = 'google';

  constructor(private readonly config: GoogleNarrationAlignerConfig) {}

  async align(input: NarrationAlignInput): Promise<NarrationAlignResult> {
    const originalWords = tokenizeNarrationWords(input.text);
    if (originalWords.length === 0) {
      return { alignment: null, strategy: 'none', provider: this.id };
    }

    const estimatedDurationSeconds = estimateMp3DurationSeconds(input.audioBuffer);

    if (estimatedDurationSeconds > SPEECH_SYNC_MAX_SECONDS) {
      console.warn(
        `[GoogleNarrationAligner] Áudio (~${Math.round(estimatedDurationSeconds)}s) excede o limite síncrono do Speech-to-Text; usando tempos estimados.`
      );
      return {
        alignment: estimateAlignmentFromDuration(input.text, estimatedDurationSeconds),
        strategy: 'estimated',
        provider: this.id,
      };
    }

    const projectId = this.config.projectId?.trim();
    if (!projectId) {
      console.error(
        '[GoogleNarrationAligner] O alinhamento com Google Speech-to-Text precisa de GOOGLE_CLOUD_PROJECT_ID (ou project_id em GOOGLE_TTS_CREDENTIALS_JSON). Sem ele, usamos tempos estimados para destacar as palavras. Defina a variável ou use NARRATION_ALIGNER=groq.'
      );
      return {
        alignment: estimateAlignmentFromDuration(input.text, estimatedDurationSeconds),
        strategy: 'estimated',
        provider: this.id,
      };
    }

    try {
      const auth = await resolveGoogleTtsAuthorization(
        this.config.apiKey,
        this.config.credentialsJson,
        projectId
      );
      const url = `https://speech.googleapis.com/v2/projects/${encodeURIComponent(projectId)}/locations/global/recognizers/_:recognize${auth.urlSuffix}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: this.config.apiKey
          ? auth.headers
          : { ...auth.headers, 'x-goog-user-project': projectId },
        body: JSON.stringify({
          config: {
            autoDecodingConfig: {},
            languageCodes: [input.languageCode],
            model: 'long',
            features: {
              enableWordTimeOffsets: true,
            },
          },
          content: input.audioBuffer.toString('base64'),
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        console.error(
          `[GoogleNarrationAligner] Speech-to-Text falhou (${response.status}): ${errorBody.slice(0, 300)}`
        );
        return {
          alignment: estimateAlignmentFromDuration(input.text, estimatedDurationSeconds),
          strategy: 'estimated',
          provider: this.id,
        };
      }

      const payload = (await response.json()) as SpeechRecognizeResponse;
      const transcribedWords = extractTranscribedWords(payload);
      const alignment = matchTranscriptionToText(originalWords, transcribedWords);

      if (!alignment) {
        console.warn(
          '[GoogleNarrationAligner] Matching fraco entre transcrição e texto original; usando tempos estimados.'
        );
        return {
          alignment: estimateAlignmentFromDuration(input.text, estimatedDurationSeconds),
          strategy: 'estimated',
          provider: this.id,
        };
      }

      return { alignment, strategy: 'provider', provider: this.id };
    } catch (error) {
      console.error('[GoogleNarrationAligner] Erro inesperado no alinhamento:', error);
      return {
        alignment: estimateAlignmentFromDuration(input.text, estimatedDurationSeconds),
        strategy: 'estimated',
        provider: this.id,
      };
    }
  }
}
