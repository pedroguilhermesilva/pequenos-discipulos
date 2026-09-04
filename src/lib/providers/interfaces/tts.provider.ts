export interface TtsAlignment {
  characters: string[];
  characterStartTimesSeconds: number[];
  characterEndTimesSeconds: number[];
}

export interface TtsGenerateParams {
  text: string;
  blockKey: string;
  voice?: string;
}

export interface TtsGenerateResult {
  buffer: Buffer;
  contentType: string;
  durationMs?: number;
}

export interface TtsGenerateWithTimestampsResult extends TtsGenerateResult {
  alignment?: TtsAlignment;
}

export interface TtsProvider {
  generateSpeech(params: TtsGenerateParams): Promise<TtsGenerateResult>;
  generateSpeechWithTimestamps?(
    params: TtsGenerateParams
  ): Promise<TtsGenerateWithTimestampsResult>;
}
