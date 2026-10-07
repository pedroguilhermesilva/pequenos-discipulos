import {
  buildTtsCacheSuffix,
  DEFAULT_GEMINI_TTS_MODEL,
  DEFAULT_GEMINI_TTS_STYLE_PROMPT,
  DEFAULT_GEMINI_TTS_VOICE,
  DEFAULT_GOOGLE_TTS_LANGUAGE,
  DEFAULT_GOOGLE_TTS_PROVIDER,
  DEFAULT_GOOGLE_TTS_VOICE,
  parseGoogleTtsProvider,
  type GoogleTtsProviderKind,
} from '@/lib/providers/google/google-tts-config';
import { extractGoogleProjectId } from '@/lib/providers/google/google-tts-auth';
import { GeminiFlashTtsProvider } from '@/lib/providers/google/gemini-flash-tts.provider';
import { GoogleTtsProvider } from '@/lib/providers/google/google-tts.provider';
import type { NarrationAligner } from '@/lib/providers/interfaces/narration-aligner';
import { createNarrationAligner } from '@/lib/providers/narration-aligner/create-narration-aligner';
import type { TtsProvider } from '@/lib/providers/interfaces/tts.provider';

export type GoogleTtsRuntimeConfig = {
  provider: GoogleTtsProviderKind;
  apiKey?: string;
  credentialsJson?: string;
  projectId?: string;
  languageCode: string;
  neuralVoice: string;
  geminiModel: string;
  geminiVoice: string;
  stylePrompt: string;
  cacheSuffix: string;
};

export function resolveGoogleTtsRuntimeConfig(env: NodeJS.ProcessEnv = process.env): GoogleTtsRuntimeConfig {
  const provider = parseGoogleTtsProvider(env.GOOGLE_TTS_PROVIDER ?? DEFAULT_GOOGLE_TTS_PROVIDER);
  const apiKey = env.GOOGLE_TTS_API_KEY?.trim() || undefined;
  const credentialsJson = env.GOOGLE_TTS_CREDENTIALS_JSON?.trim() || undefined;
  const projectId =
    env.GOOGLE_CLOUD_PROJECT_ID?.trim() ||
    extractGoogleProjectId(credentialsJson) ||
    undefined;
  const languageCode = env.GOOGLE_TTS_LANGUAGE?.trim() || DEFAULT_GOOGLE_TTS_LANGUAGE;
  const neuralVoice = env.GOOGLE_TTS_VOICE?.trim() || DEFAULT_GOOGLE_TTS_VOICE;
  const geminiModel = env.GOOGLE_TTS_MODEL?.trim() || DEFAULT_GEMINI_TTS_MODEL;
  const geminiVoice = env.GOOGLE_TTS_GEMINI_VOICE?.trim() || DEFAULT_GEMINI_TTS_VOICE;
  const stylePrompt = env.GOOGLE_TTS_STYLE_PROMPT?.trim() || DEFAULT_GEMINI_TTS_STYLE_PROMPT;

  const cacheSuffix = buildTtsCacheSuffix({
    provider,
    voice: provider === 'neural2' ? neuralVoice : geminiVoice,
    model: geminiModel,
    stylePrompt,
  });

  return {
    provider,
    apiKey,
    credentialsJson,
    projectId,
    languageCode,
    neuralVoice,
    geminiModel,
    geminiVoice,
    stylePrompt,
    cacheSuffix,
  };
}

export function createGoogleTtsProvider(
  config: GoogleTtsRuntimeConfig,
  env: NodeJS.ProcessEnv = process.env,
  narrationAligner?: NarrationAligner
): TtsProvider {
  if (config.provider === 'neural2') {
    return new GoogleTtsProvider({
      apiKey: config.apiKey,
      credentialsJson: config.credentialsJson,
      voiceName: config.neuralVoice,
      languageCode: config.languageCode,
    });
  }

  // GOOGLE_CLOUD_PROJECT_ID é opcional: com API key o Gemini TTS funciona sem ele.
  // Nunca validar aqui — este código corre na avaliação do módulo (build da Vercel).
  const aligner =
    narrationAligner ??
    createNarrationAligner(env, {
      apiKey: config.apiKey,
      credentialsJson: config.credentialsJson,
      projectId: config.projectId,
      languageCode: config.languageCode,
    });

  return new GeminiFlashTtsProvider(
    {
      apiKey: config.apiKey,
      credentialsJson: config.credentialsJson,
      projectId: config.projectId,
      modelName: config.geminiModel,
      voiceName: config.geminiVoice,
      languageCode: config.languageCode,
      stylePrompt: config.stylePrompt,
    },
    aligner
  );
}
