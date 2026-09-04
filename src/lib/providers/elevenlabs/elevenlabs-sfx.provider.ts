import { DomainError } from '@/lib/domain/errors';
import { parseElevenLabsError } from '@/lib/providers/elevenlabs/parse-elevenlabs-error';
import type {
  SfxGenerateParams,
  SfxGenerateResult,
  SfxProvider,
} from '@/lib/providers/interfaces/sfx.provider';

export interface ElevenLabsSfxConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export class ElevenLabsSfxProvider implements SfxProvider {
  constructor(private readonly config: ElevenLabsSfxConfig) {}

  async generateSound(params: SfxGenerateParams): Promise<SfxGenerateResult> {
    const baseUrl = this.config.baseUrl.replace(/\/$/, '');
    const url = `${baseUrl}/sound-generation?output_format=mp3_44100_128`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': this.config.apiKey,
      },
      body: JSON.stringify({
        text: params.prompt,
        model_id: this.config.model,
        duration_seconds: params.durationSeconds ?? 2,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new DomainError(
        'SFX_NOT_CONFIGURED',
        parseElevenLabsError(response.status, errorBody)
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return { buffer, contentType: 'audio/mpeg', durationMs: (params.durationSeconds ?? 2) * 1000 };
  }
}
