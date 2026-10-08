import {
  buildStoryReviewSystemPrompt,
  buildStoryReviewUserPrompt,
  parseStoryReviewResponse,
} from '@/lib/llm/story-moderation.prompt';
import type {
  StoryReviewParams,
  StoryReviewProvider,
} from '@/lib/providers/interfaces/story-review.provider';

export class ChatCompletionsStoryReviewProvider implements StoryReviewProvider {
  constructor(
    private readonly config: {
      apiKey: string;
      baseUrl: string;
      model: string;
    }
  ) {}

  async review(params: StoryReviewParams) {
    const baseUrl = this.config.baseUrl.replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildStoryReviewSystemPrompt() },
          { role: 'user', content: buildStoryReviewUserPrompt(params) },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Revisão LLM falhou (${response.status}): ${body.slice(0, 200)}`);
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Revisão LLM retornou resposta vazia.');
    }

    return parseStoryReviewResponse(content);
  }
}
