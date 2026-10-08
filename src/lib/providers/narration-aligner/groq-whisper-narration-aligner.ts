import { estimateAlignmentFromDuration } from '@/lib/providers/google/estimate-alignment';
import {
  matchTranscriptionToText,
  type TranscribedWord,
} from '@/lib/providers/google/match-transcription-words';
import { tokenizeNarrationWords } from '@/lib/providers/google/google-tts-ssml';
import type {
  NarrationAligner,
  NarrationAlignInput,
  NarrationAlignResult,
} from '@/lib/providers/interfaces/narration-aligner';
import {
  estimateMp3DurationSeconds,
  whisperLanguageCode,
} from '@/lib/providers/narration-aligner/estimate-audio-duration';

const GROQ_TRANSCRIBE_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

export const DEFAULT_GROQ_WHISPER_MODEL = 'whisper-large-v3-turbo';

export type GroqWhisperNarrationAlignerConfig = {
  apiKey: string;
  model?: string;
};

type GroqVerboseTranscription = {
  words?: Array<{
    word?: string;
    start?: number;
    end?: number;
  }>;
};

function extensionForContentType(contentType: string): string {
  if (contentType.includes('mpeg') || contentType.includes('mp3')) return 'mp3';
  if (contentType.includes('wav')) return 'wav';
  if (contentType.includes('ogg')) return 'ogg';
  return 'mp3';
}

function buildGroqFormData(input: NarrationAlignInput, model: string): FormData {
  const form = new FormData();
  const extension = extensionForContentType(input.contentType);
  const blob = new Blob([Uint8Array.from(input.audioBuffer)], { type: input.contentType });

  form.append('file', blob, `narration.${extension}`);
  form.append('model', model);
  form.append('response_format', 'verbose_json');
  form.append('timestamp_granularities[]', 'word');
  form.append('language', whisperLanguageCode(input.languageCode));
  form.append('temperature', '0');

  return form;
}

function extractGroqWords(payload: GroqVerboseTranscription): TranscribedWord[] {
  return (payload.words ?? [])
    .filter((item) => item.word != null && item.start != null && item.end != null)
    .map((item) => ({
      word: item.word!,
      startSeconds: item.start!,
      endSeconds: item.end!,
    }));
}

export class GroqWhisperNarrationAligner implements NarrationAligner {
  readonly id = 'groq';

  constructor(private readonly config: GroqWhisperNarrationAlignerConfig) {}

  async align(input: NarrationAlignInput): Promise<NarrationAlignResult> {
    const originalWords = tokenizeNarrationWords(input.text);
    if (originalWords.length === 0) {
      return { alignment: null, strategy: 'none', provider: this.id };
    }

    const estimatedDurationSeconds = estimateMp3DurationSeconds(input.audioBuffer);
    const model = this.config.model ?? DEFAULT_GROQ_WHISPER_MODEL;

    try {
      const response = await fetch(GROQ_TRANSCRIBE_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: buildGroqFormData(input, model),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        console.error(
          `[GroqWhisperNarrationAligner] Transcrição falhou (${response.status}): ${errorBody.slice(0, 300)}`
        );
        return {
          alignment: estimateAlignmentFromDuration(input.text, estimatedDurationSeconds),
          strategy: 'estimated',
          provider: this.id,
        };
      }

      const payload = (await response.json()) as GroqVerboseTranscription;
      const transcribedWords = extractGroqWords(payload);
      const alignment = matchTranscriptionToText(originalWords, transcribedWords);

      if (!alignment) {
        console.warn(
          '[GroqWhisperNarrationAligner] Matching fraco entre transcrição e texto original; usando tempos estimados.'
        );
        return {
          alignment: estimateAlignmentFromDuration(input.text, estimatedDurationSeconds),
          strategy: 'estimated',
          provider: this.id,
        };
      }

      return { alignment, strategy: 'provider', provider: this.id };
    } catch (error) {
      console.error('[GroqWhisperNarrationAligner] Erro inesperado no alinhamento:', error);
      return {
        alignment: estimateAlignmentFromDuration(input.text, estimatedDurationSeconds),
        strategy: 'estimated',
        provider: this.id,
      };
    }
  }
}
