import type { TtsAlignment } from '@/lib/providers/interfaces/tts.provider';

export type NarrationAlignStrategy = 'provider' | 'estimated' | 'none';

export type NarrationAlignResult = {
  alignment: TtsAlignment | null;
  strategy: NarrationAlignStrategy;
  provider: string;
};

export type NarrationAlignInput = {
  text: string;
  audioBuffer: Buffer;
  contentType: string;
  languageCode: string;
};

export interface NarrationAligner {
  readonly id: string;
  align(input: NarrationAlignInput): Promise<NarrationAlignResult>;
}
