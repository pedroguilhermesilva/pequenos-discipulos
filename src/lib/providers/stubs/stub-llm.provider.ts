import { DomainError } from '@/lib/domain/errors';
import { adaptationContentSchema } from '@/lib/domain/schemas';
import type {
  LlmGenerateStoryParams,
  LlmGenerateStoryResult,
  LlmProvider,
} from '@/lib/providers/interfaces/llm.provider';
import { A_ESTRELA_DE_MATEUS_PAGES } from '@/lib/stories/story-viewer-pages';
import { getStoryQuiz } from '@/lib/stories/story-quiz';

/**
 * Deterministic stub used until LLM_API_KEY is configured.
 * Produces valid AdaptationContent for local flows.
 */
export class StubLlmProvider implements LlmProvider {
  async generateStory(params: LlmGenerateStoryParams): Promise<LlmGenerateStoryResult> {
    const content = adaptationContentSchema.parse({
      pages: A_ESTRELA_DE_MATEUS_PAGES,
    });

    return {
      title: `História: ${params.reference}`,
      content,
      quiz: getStoryQuiz('1', params.ageTier) ?? undefined,
      adaptationNote: `Adaptado para ${params.ageTier} em estilo ${params.languageStyle}.`,
    };
  }
}

export class UnconfiguredLlmProvider implements LlmProvider {
  async generateStory(): Promise<LlmGenerateStoryResult> {
    throw new DomainError(
      'LLM_NOT_CONFIGURED',
      'LLM_API_KEY não configurada. Use StubLlmProvider em desenvolvimento.'
    );
  }
}
