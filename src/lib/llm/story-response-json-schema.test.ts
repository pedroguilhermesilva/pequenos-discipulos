import { describe, expect, it } from 'vitest';
import { quizOptionSchema, storyQuizSchema } from '@/lib/domain/schemas';
import {
  pedagogicalInteractiveMarkerSchema,
  pedagogicalMetadataSchema,
  pedagogicalStoryResponseSchema,
  pedagogicalTextBlockSchema,
} from '@/lib/llm/pedagogical-story.schema';
import {
  STORY_RESPONSE_JSON_SCHEMA,
  STORY_RESPONSE_SCHEMA_NAME,
} from '@/lib/llm/story-response-json-schema';
import { buildSamplePedagogicalStory } from '@/lib/llm/test-fixtures';

type JsonSchema = {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean;
  items?: JsonSchema;
  anyOf?: JsonSchema[];
  enum?: unknown[];
};

function collectObjects(schema: JsonSchema, path = '$', out: Array<[string, JsonSchema]> = []) {
  if (schema.properties) out.push([path, schema]);
  for (const [key, child] of Object.entries(schema.properties ?? {})) collectObjects(child, `${path}.${key}`, out);
  if (schema.items) collectObjects(schema.items, `${path}[]`, out);
  schema.anyOf?.forEach((child, index) => collectObjects(child, `${path}|${index}`, out));
  return out;
}

const root = STORY_RESPONSE_JSON_SCHEMA as unknown as JsonSchema;
const textBlock = root.properties!.conteudo_estruturado.items!;
const marker = textBlock.properties!.marcadores_interativos.items!;
const quiz = root.properties!.quiz;
const question = quiz.properties!.questions.items!;
const option = question.properties!.options.items!;

function keys(shape: Record<string, unknown>) {
  return Object.keys(shape).sort();
}

describe('STORY_RESPONSE_JSON_SCHEMA (OpenAI strict structured outputs)', () => {
  it('has a valid name', () => {
    expect(STORY_RESPONSE_SCHEMA_NAME).toMatch(/^[a-zA-Z0-9_-]{1,64}$/);
  });

  it('is strict-compatible: every object lists all keys as required and forbids extra keys', () => {
    for (const [path, object] of collectObjects(root)) {
      expect(object.additionalProperties, path).toBe(false);
      expect([...(object.required ?? [])].sort(), path).toEqual(Object.keys(object.properties!).sort());
    }
  });

  it('stays in sync with the Zod schemas (same keys)', () => {
    expect(keys(root.properties!)).toEqual(keys(pedagogicalStoryResponseSchema.shape));
    expect(keys(root.properties!.metadata.properties!)).toEqual(keys(pedagogicalMetadataSchema.shape));
    expect(keys(textBlock.properties!)).toEqual(keys(pedagogicalTextBlockSchema.shape));
    expect(keys(marker.properties!)).toEqual(keys(pedagogicalInteractiveMarkerSchema.shape));
    expect(keys(quiz.properties!)).toEqual(keys(storyQuizSchema.shape));
    expect(keys(option.properties!)).toEqual(keys(quizOptionSchema.shape));
    expect(keys(question.properties!)).toEqual(
      ['correctOptionId', 'encouragementAlmost', 'encouragementCorrect', 'id', 'options', 'prompt', 'type']
    );
  });

  it('requires marcadores_interativos on every text block', () => {
    expect(textBlock.required).toContain('marcadores_interativos');
    expect(textBlock.properties!.tipo.enum).toEqual(['texto']);
  });

  it('the shared fixture validates with Zod', () => {
    expect(pedagogicalStoryResponseSchema.safeParse(buildSamplePedagogicalStory()).success).toBe(true);
  });

  it('the example embedded in the prompt is itself a valid story (parser accepts it)', async () => {
    const { parseStoryGenerationResponse } = await import('@/lib/llm/parse-story-response');
    const { STORY_RESPONSE_EXAMPLE } = await import('@/lib/llm/story-response-json-schema');
    const result = parseStoryGenerationResponse(JSON.stringify(STORY_RESPONSE_EXAMPLE));
    expect(result.quiz?.questions).toHaveLength(2);
    expect(result.content.pages.length).toBeGreaterThan(0);
    const words = result.content.pages
      .flatMap((p) => p.paragraphs.flat())
      .filter((part) => part.type === 'word');
    expect(words.length).toBeGreaterThan(0);
  });
});
