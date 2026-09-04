import { LlmValidationError } from '@/lib/domain/errors';
import {
  adaptationContentSchema,
  storyQuizSchema,
} from '@/lib/domain/schemas';
import type { LlmGenerateStoryResult } from '@/lib/providers/interfaces/llm.provider';
import {
  buildAdaptationNoteFromPedagogical,
  buildTitleFromPedagogicalMetadata,
  mapPedagogicalStoryToContent,
} from '@/lib/llm/map-pedagogical-story';
import { assertPedagogicalStructure } from '@/lib/llm/validate-pedagogical-story';
import { pedagogicalStoryResponseSchema } from '@/lib/llm/pedagogical-story.schema';
import { z } from 'zod';

const legacyStoryResponseSchema = z.object({
  title: z.string().min(1),
  content: adaptationContentSchema,
  quiz: storyQuizSchema.optional(),
  adaptationNote: z.string().optional(),
});

export function parseStoryGenerationResponse(rawContent: string): LlmGenerateStoryResult {
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(rawContent);
  } catch {
    throw new LlmValidationError('O modelo devolveu JSON inválido.');
  }

  const pedagogical = pedagogicalStoryResponseSchema.safeParse(parsedJson);
  if (pedagogical.success) {
    assertPedagogicalStructure(pedagogical.data);
    const content = mapPedagogicalStoryToContent(pedagogical.data);
    const validatedContent = adaptationContentSchema.safeParse(content);
    if (!validatedContent.success) {
      throw new LlmValidationError(validatedContent.error.message);
    }

    return {
      title: buildTitleFromPedagogicalMetadata(pedagogical.data.metadata),
      content: validatedContent.data,
      quiz: pedagogical.data.quiz,
      adaptationNote: buildAdaptationNoteFromPedagogical(pedagogical.data),
    };
  }

  const legacy = legacyStoryResponseSchema.safeParse(parsedJson);
  if (!legacy.success) {
    throw new LlmValidationError(
      pedagogical.error.message || legacy.error.message || 'Formato de história inválido.'
    );
  }

  return {
    title: legacy.data.title,
    content: legacy.data.content,
    quiz: legacy.data.quiz,
    adaptationNote: legacy.data.adaptationNote,
  };
}
