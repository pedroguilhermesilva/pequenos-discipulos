import { DomainError, LlmValidationError } from '@/lib/domain/errors';
import { parseStoryGenerationResponse } from '@/lib/llm/parse-story-response';
import {
  buildStoryGenerationSystemPrompt,
  buildStoryGenerationUserPrompt,
} from '@/lib/llm/story-generation.prompt';
import type {
  LlmGenerateStoryParams,
  LlmGenerateStoryResult,
  LlmProvider,
} from '@/lib/providers/interfaces/llm.provider';

export interface ChatCompletionsLlmConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  /** Label used in error messages (e.g. OpenAI, Groq) */
  providerName?: string;
}

/**
 * LLM provider for APIs compatible with OpenAI Chat Completions
 * (OpenAI, Azure OpenAI, Groq, Together, Ollama with OpenAI shim, etc.).
 */
export class ChatCompletionsLlmProvider implements LlmProvider {
  private readonly providerName: string;

  constructor(private readonly config: ChatCompletionsLlmConfig) {
    this.providerName = config.providerName ?? 'LLM';
  }

  async generateStory(params: LlmGenerateStoryParams): Promise<LlmGenerateStoryResult> {
    const baseUrl = this.config.baseUrl.replace(/\/$/, '');
    const url = `${baseUrl}/chat/completions`;
    let lastError: unknown;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const userPrompt =
        attempt === 0
          ? buildStoryGenerationUserPrompt(params)
          : `${buildStoryGenerationUserPrompt(params)}

CORREÇÃO OBRIGATÓRIA: a resposta anterior não seguiu a estrutura.
- Alterne blocos "texto" e "interativo" (nunca dois do mesmo tipo seguidos).
- Não coloque a história inteira em um único bloco "texto".
- Termine com um bloco "texto" após o último "interativo".
- Inclua "quiz" com 2 a 3 perguntas; cada pergunta com exatamente 3 opções.`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          temperature: attempt === 0 ? 0.7 : 0.4,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: buildStoryGenerationSystemPrompt() },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new DomainError(
          'LLM_VALIDATION_ERROR',
          `${this.providerName} respondeu ${response.status}${errorBody ? `: ${errorBody.slice(0, 240)}` : '.'}`
        );
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string | null } }>;
      };

      const rawContent = payload.choices?.[0]?.message?.content;
      if (!rawContent?.trim()) {
        throw new DomainError('LLM_VALIDATION_ERROR', `${this.providerName} devolveu resposta vazia.`);
      }

      try {
        return parseStoryGenerationResponse(rawContent);
      } catch (error) {
        lastError = error;
        if (attempt === 1 || !(error instanceof LlmValidationError)) {
          throw error;
        }
      }
    }

    throw lastError;
  }
}
