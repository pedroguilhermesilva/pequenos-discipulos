import { FRIENDLY_GENERATION_ERROR, LlmValidationError } from '@/lib/domain/errors';
import {
  adaptationContentSchema,
  storyQuizSchema,
  type StoryQuizData,
} from '@/lib/domain/schemas';
import type { LlmGenerateStoryResult } from '@/lib/providers/interfaces/llm.provider';
import {
  buildAdaptationNoteFromPedagogical,
  buildTitleFromPedagogicalMetadata,
  mapPedagogicalStoryToContent,
} from '@/lib/llm/map-pedagogical-story';
import { assertPedagogicalStructure } from '@/lib/llm/validate-pedagogical-story';
import {
  pedagogicalStoryResponseSchema,
  type PedagogicalStoryResponse,
} from '@/lib/llm/pedagogical-story.schema';
import { z } from 'zod';

const legacyStoryResponseSchema = z.object({
  title: z.string().min(1),
  content: adaptationContentSchema,
  quiz: storyQuizSchema.optional(),
  adaptationNote: z.string().optional(),
});

/** História sem o quiz — o quiz é validado à parte para não deitar fora uma história boa. */
const storyWithoutQuizSchema = pedagogicalStoryResponseSchema
  .omit({ quiz: true })
  .extend({ quiz: z.unknown().optional() });

const ROTULO_MAX_LENGTH = 40;

/** Resumo legível dos erros Zod (caminhos + mensagem) para logs — sem o conteúdo da história. */
export function summarizeZodIssues(error: z.ZodError, limit = 8): string {
  return error.issues
    .slice(0, limit)
    .map((issue) => `${issue.path.join('.') || '(raiz)'}: ${issue.message}`)
    .join('; ');
}

function stripNulls(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripNulls);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, child]) => child !== null)
        .map(([key, child]) => [key, stripNulls(child)])
    );
  }
  return value;
}

function shorten(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > ROTULO_MAX_LENGTH ? `${clean.slice(0, ROTULO_MAX_LENGTH - 1).trimEnd()}…` : clean;
}

/** Tolerância para o modo json_object: preenche `rotulo` em falta a partir de campos parecidos. */
function fillMissingRotulo(json: unknown): unknown {
  if (!json || typeof json !== 'object') return json;
  const story = json as { conteudo_estruturado?: unknown };
  if (!Array.isArray(story.conteudo_estruturado)) return json;

  return {
    ...story,
    conteudo_estruturado: story.conteudo_estruturado.map((block) => {
      if (!block || typeof block !== 'object') return block;
      const b = block as Record<string, unknown>;
      if (b.tipo !== 'interativo' || (typeof b.rotulo === 'string' && b.rotulo.trim())) return block;
      const candidate = [b.label, b.titulo, b.texto_para_audio].find(
        (value): value is string => typeof value === 'string' && value.trim().length > 0
      );
      return candidate ? { ...b, rotulo: shorten(candidate) } : block;
    }),
  };
}

function invalid(details: string): LlmValidationError {
  return new LlmValidationError(FRIENDLY_GENERATION_ERROR, details);
}

export function parseStoryGenerationResponse(rawContent: string): LlmGenerateStoryResult {
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(rawContent);
  } catch {
    throw invalid(`O modelo devolveu JSON inválido (${rawContent.length} caracteres).`);
  }

  const normalized = fillMissingRotulo(stripNulls(parsedJson));
  const pedagogical = storyWithoutQuizSchema.safeParse(normalized);

  if (pedagogical.success) {
    const story = pedagogical.data as Omit<PedagogicalStoryResponse, 'quiz'> & { quiz?: unknown };

    try {
      assertPedagogicalStructure(story as PedagogicalStoryResponse);
    } catch (error) {
      throw invalid(`Estrutura: ${(error as Error).message}`);
    }

    const content = mapPedagogicalStoryToContent(story as PedagogicalStoryResponse);
    const validatedContent = adaptationContentSchema.safeParse(content);
    if (!validatedContent.success) {
      throw invalid(`Conteúdo mapeado: ${summarizeZodIssues(validatedContent.error)}`);
    }

    let quiz: StoryQuizData | undefined;
    if (story.quiz !== undefined) {
      const parsedQuiz = storyQuizSchema.safeParse(story.quiz);
      if (parsedQuiz.success) {
        quiz = parsedQuiz.data;
      } else {
        console.warn(
          `[LLM] Quiz inválido descartado (a história foi mantida): ${summarizeZodIssues(parsedQuiz.error)}`
        );
      }
    }

    return {
      title: buildTitleFromPedagogicalMetadata(story.metadata),
      content: validatedContent.data,
      quiz,
      adaptationNote: buildAdaptationNoteFromPedagogical(story as PedagogicalStoryResponse),
    };
  }

  const legacy = legacyStoryResponseSchema.safeParse(normalized);
  if (!legacy.success) {
    throw invalid(summarizeZodIssues(pedagogical.error));
  }

  return {
    title: legacy.data.title,
    content: legacy.data.content,
    quiz: legacy.data.quiz,
    adaptationNote: legacy.data.adaptationNote,
  };
}
