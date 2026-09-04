export interface SfxGenerateParams {
  prompt: string;
  blockKey: string;
  durationSeconds?: number;
}

export interface SfxGenerateResult {
  buffer: Buffer;
  contentType: string;
  durationMs?: number;
}

export interface SfxProvider {
  generateSound(params: SfxGenerateParams): Promise<SfxGenerateResult>;
}
