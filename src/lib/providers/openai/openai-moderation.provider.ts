import type {
  ContentModerationProvider,
  ContentModerationResult,
} from '@/lib/providers/interfaces/content-moderation.provider';

export class OpenAiModerationProvider implements ContentModerationProvider {
  constructor(
    private readonly config: {
      apiKey: string;
      baseUrl?: string;
    }
  ) {}

  async moderate(text: string): Promise<ContentModerationResult> {
    const baseUrl = this.config.baseUrl?.replace(/\/$/, '') ?? 'https://api.openai.com/v1';
    const response = await fetch(`${baseUrl}/moderations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'omni-moderation-latest',
        input: text.slice(0, 12_000),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Moderação de conteúdo falhou (${response.status}): ${body.slice(0, 200)}`);
    }

    const json = (await response.json()) as {
      results?: Array<{
        flagged?: boolean;
        categories?: Record<string, boolean>;
      }>;
    };

    const result = json.results?.[0];
    const categories = Object.entries(result?.categories ?? {})
      .filter(([, flagged]) => flagged)
      .map(([name]) => name);

    return {
      flagged: Boolean(result?.flagged),
      categories,
    };
  }
}
