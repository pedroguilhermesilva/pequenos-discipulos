import { storyQuizSchema } from '@/lib/domain/schemas';
import { z } from 'zod';

function normalizeTagSom(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function coerceCapitulo(value: unknown): unknown {
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    return Number.parseInt(value, 10);
  }
  return value;
}

export const pedagogicalMetadataSchema = z.object({
  livro: z.string().min(1),
  capitulo: z.preprocess(coerceCapitulo, z.number().int().nonnegative()),
  versiculo: z.string().min(1),
  idade_alvo: z.preprocess(
    (value) => (typeof value === 'string' && /^\d+$/.test(value) ? Number.parseInt(value, 10) : value),
    z.number().int().min(3).max(11)
  ),
});

export const pedagogicalTextBlockSchema = z.object({
  tipo: z.literal('texto'),
  conteudo: z.string().min(1),
});

export const pedagogicalInteractiveBlockSchema = z.object({
  tipo: z.literal('interativo'),
  rotulo: z.string().min(1),
  texto_para_audio: z.string().min(1),
  tag_som: z.preprocess(
    normalizeTagSom,
    z
      .string()
      .min(1)
      .regex(/^[a-z0-9_]+$/, 'tag_som deve ser minúscula, sem acentos, com underscores')
  ),
});

export const pedagogicalBlockSchema = z.discriminatedUnion('tipo', [
  pedagogicalTextBlockSchema,
  pedagogicalInteractiveBlockSchema,
]);

export const pedagogicalStoryResponseSchema = z.object({
  metadata: pedagogicalMetadataSchema,
  conteudo_estruturado: z.array(pedagogicalBlockSchema).min(1),
  quiz: storyQuizSchema,
});

export type PedagogicalStoryResponse = z.infer<typeof pedagogicalStoryResponseSchema>;
