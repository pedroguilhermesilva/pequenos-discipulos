import { DomainError, FRIENDLY_GENERATION_ERROR, LlmValidationError } from '@/lib/domain/errors';
import { parseStoryGenerationResponse } from '@/lib/llm/parse-story-response';
import {
  STORY_RESPONSE_JSON_SCHEMA,
  STORY_RESPONSE_SCHEMA_NAME,
} from '@/lib/llm/story-response-json-schema';
import {
  buildStoryGenerationSystemPrompt,
  buildStoryGenerationUserPrompt,
} from '@/lib/llm/story-generation.prompt';
import type {
  LlmGenerateStoryParams,
  LlmGenerateStoryResult,
  LlmProvider,
} from '@/lib/providers/interfaces/llm.provider';

export type LlmResponseFormat = 'json_schema' | 'json_object';

export interface ChatCompletionsLlmConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  /** Label used in error messages (e.g. OpenAI, Groq) */
  providerName?: string;
  /**
   * `json_schema` = OpenAI Structured Outputs (strict). `json_object` = JSON livre + validação.
   * Por omissão: json_schema para api.openai.com, json_object para os restantes.
   */
  responseFormat?: LlmResponseFormat;
}

const MAX_ATTEMPTS = 2;

const RETRY_INSTRUCTIONS = `

CORREÇÃO OBRIGATÓRIA: a resposta anterior não seguiu a estrutura.
- Siga EXATAMENTE o formato JSON descrito (todos os campos, incluindo marcadores_interativos em cada bloco "texto").
- Use APENAS blocos "texto" — sem blocos "interativo" separados e sem linhas "Ouvir {algo}".
- Cada marcador_interativo deve referenciar uma palavra que existe no conteudo do mesmo bloco.
- Divida a narrativa em vários blocos "texto" curtos (não um bloco único com tudo).
- Inclua "quiz" com title, subtitle, celebrationTitle, celebrationMessage e questions (2 a 3 perguntas, cada uma com exatamente 3 opções).`;

export function resolveDefaultResponseFormat(baseUrl: string): LlmResponseFormat {
  try {
    return new URL(baseUrl).hostname === 'api.openai.com' ? 'json_schema' : 'json_object';
  } catch {
    return 'json_object';
  }
}

function buildResponseFormat(format: LlmResponseFormat) {
  if (format === 'json_object') return { type: 'json_object' as const };
  return {
    type: 'json_schema' as const,
    json_schema: {
      name: STORY_RESPONSE_SCHEMA_NAME,
      strict: true,
      schema: STORY_RESPONSE_JSON_SCHEMA,
    },
  };
}

function isResponseFormatRejection(status: number, body: string): boolean {
  return status === 400 && /response_format|json_schema|structured/i.test(body);
}

function redact(text: string): string {
  return text.replace(/sk-[A-Za-z0-9_*-]+/g, 'sk-[redacted]').slice(0, 300);
}

/**
 * LLM provider for APIs compatible with OpenAI Chat Completions
 * (OpenAI, Azure OpenAI, Groq, Together, Ollama with OpenAI shim, etc.).
 */
export class ChatCompletionsLlmProvider implements LlmProvider {
  private readonly providerName: string;
  private responseFormat: LlmResponseFormat;

  constructor(private readonly config: ChatCompletionsLlmConfig) {
    this.providerName = config.providerName ?? 'LLM';
    this.responseFormat = config.responseFormat ?? resolveDefaultResponseFormat(config.baseUrl);
  }

  private logContext(attempt: number) {
    return `provider=${this.providerName} model=${this.config.model} format=${this.responseFormat} attempt=${attempt + 1}/${MAX_ATTEMPTS}`;
  }

  private async callApi(userPrompt: string, temperature: number): Promise<string> {
    const url = `${this.config.baseUrl.replace(/\/$/, '')}/chat/completions`;

    for (;;) {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          temperature,
          response_format: buildResponseFormat(this.responseFormat),
          messages: [
            { role: 'system', content: buildStoryGenerationSystemPrompt() },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');

        if (this.responseFormat === 'json_schema' && isResponseFormatRejection(response.status, errorBody)) {
          console.warn(
            `[LLM] ${this.providerName} recusou json_schema (${response.status}); a usar json_object. ${redact(errorBody)}`
          );
          this.responseFormat = 'json_object';
          continue;
        }

        console.error(
          `[LLM] ${this.providerName} respondeu ${response.status} model=${this.config.model}: ${redact(errorBody)}`
        );
        throw new DomainError('LLM_UNAVAILABLE', FRIENDLY_GENERATION_ERROR);
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string | null; refusal?: string | null } }>;
      };
      const message = payload.choices?.[0]?.message;
      if (message?.refusal) {
        throw new LlmValidationError(FRIENDLY_GENERATION_ERROR, `Modelo recusou: ${redact(message.refusal)}`);
      }
      const rawContent = message?.content;
      if (!rawContent?.trim()) {
        throw new LlmValidationError(FRIENDLY_GENERATION_ERROR, 'Resposta vazia do modelo.');
      }
      return rawContent;
    }
  }

  async generateStory(params: LlmGenerateStoryParams): Promise<LlmGenerateStoryResult> {
    let lastError: LlmValidationError | undefined;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const userPrompt =
        attempt === 0
          ? buildStoryGenerationUserPrompt(params)
          : `${buildStoryGenerationUserPrompt(params)}${RETRY_INSTRUCTIONS}`;

      try {
        const rawContent = await this.callApi(userPrompt, attempt === 0 ? 0.7 : 0.4);
        return parseStoryGenerationResponse(rawContent);
      } catch (error) {
        if (!(error instanceof LlmValidationError)) throw error;
        lastError = error;
        const details = error.details ?? error.message;
        if (attempt < MAX_ATTEMPTS - 1) {
          console.warn(`[LLM] Resposta inválida, a tentar de novo. ${this.logContext(attempt)} ref="${params.reference}" ${details}`);
        } else {
          console.error(`[LLM] Resposta inválida após ${MAX_ATTEMPTS} tentativas. ${this.logContext(attempt)} ref="${params.reference}" ${details}`);
        }
      }
    }

    throw new LlmValidationError(FRIENDLY_GENERATION_ERROR, lastError?.details);
  }
}
