import { parseGoogleDurationSeconds } from '@/lib/providers/google/parse-google-duration';
import { estimateAlignmentFromDuration } from '@/lib/providers/google/estimate-alignment';
import {
  matchTranscriptionToText,
  type TranscribedWord,
} from '@/lib/providers/google/match-transcription-words';
import { resolveGoogleTtsAuthorization } from '@/lib/providers/google/google-tts-auth';
import { tokenizeNarrationWords } from '@/lib/providers/google/google-tts-ssml';
import type { TtsAlignment } from '@/lib/providers/interfaces/tts.provider';

const SPEECH_SYNC_MAX_SECONDS = 55;

export type GoogleSpeechAlignmentConfig = {
  apiKey?: string;
  credentialsJson?: string;
  projectId: string;
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

function estimateMp3DurationSeconds(buffer: Buffer): number {
  const bitrateKbps = 128;
  return Math.max(1, (buffer.length * 8) / (bitrateKbps * 1000));
}

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

export async function alignAudioToText(
  text: string,
  audioBuffer: Buffer,
  config: GoogleSpeechAlignmentConfig
): Promise<{ alignment: TtsAlignment | null; strategy: 'speech-to-text' | 'estimated' | 'none' }> {
  const originalWords = tokenizeNarrationWords(text);
  if (originalWords.length === 0) {
    return { alignment: null, strategy: 'none' };
  }

  const estimatedDurationSeconds = estimateMp3DurationSeconds(audioBuffer);

  if (estimatedDurationSeconds > SPEECH_SYNC_MAX_SECONDS) {
    console.warn(
      `[GoogleSpeechAlignment] Áudio (~${Math.round(estimatedDurationSeconds)}s) excede o limite síncrono do Speech-to-Text; usando tempos estimados.`
    );
    return {
      alignment: estimateAlignmentFromDuration(text, estimatedDurationSeconds),
      strategy: 'estimated',
    };
  }

  try {
    const auth = await resolveGoogleTtsAuthorization(config.apiKey, config.credentialsJson);
    const url = `https://speech.googleapis.com/v2/projects/${encodeURIComponent(config.projectId)}/locations/global/recognizers/_:recognize${auth.urlSuffix}`;

    const headers: Record<string, string> = {
      ...auth.headers,
      'x-goog-user-project': config.projectId,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        config: {
          autoDecodingConfig: {},
          languageCodes: [config.languageCode],
          model: 'long',
          features: {
            enableWordTimeOffsets: true,
          },
        },
        content: audioBuffer.toString('base64'),
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      console.error(
        `[GoogleSpeechAlignment] Speech-to-Text falhou (${response.status}): ${errorBody.slice(0, 300)}`
      );
      return {
        alignment: estimateAlignmentFromDuration(text, estimatedDurationSeconds),
        strategy: 'estimated',
      };
    }

    const payload = (await response.json()) as SpeechRecognizeResponse;
    const transcribedWords = extractTranscribedWords(payload);
    const alignment = matchTranscriptionToText(originalWords, transcribedWords);

    if (!alignment) {
      console.warn('[GoogleSpeechAlignment] Matching fraco entre transcrição e texto original; usando tempos estimados.');
      return {
        alignment: estimateAlignmentFromDuration(text, estimatedDurationSeconds),
        strategy: 'estimated',
      };
    }

    return { alignment, strategy: 'speech-to-text' };
  } catch (error) {
    console.error('[GoogleSpeechAlignment] Erro inesperado no alinhamento:', error);
    return {
      alignment: estimateAlignmentFromDuration(text, estimatedDurationSeconds),
      strategy: 'estimated',
    };
  }
}
