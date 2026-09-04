import { z } from 'zod';

export const ageTierSchema = z.enum(['3-5', '6-8', '9-11']);
export const contentTypeSchema = z.enum(['text', 'audio', 'video']);
export const languageStyleSchema = z.enum(['simple', 'rhymes', 'adventure']);
export const adaptationStatusSchema = z.enum([
  'draft',
  'family_approved',
  'community',
  'as_default',
]);

export const storyTextPartSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), value: z.string() }),
  z.object({ type: z.literal('em'), value: z.string() }),
  z.object({
    type: z.literal('word'),
    value: z.string(),
    variant: z.enum(['default', 'vida']).optional(),
    ariaLabel: z.string().optional(),
    sfxPrompt: z.string().optional(),
    audioPath: z.string().optional(),
  }),
  z.object({
    type: z.literal('audio-pill'),
    label: z.string(),
    variant: z.enum(['efeito', 'narracao', 'ambiente']).optional(),
    sfxPrompt: z.string().optional(),
    audioPath: z.string().optional(),
  }),
  z.object({
    type: z.literal('interactive'),
    rotulo: z.string(),
    textoParaAudio: z.string(),
    tagSom: z.string(),
    audioPath: z.string().optional(),
  }),
]);

export const storyPageActivitySchema = z.object({
  title: z.string(),
  icon: z.string(),
  buttonAriaLabel: z.string(),
  filledIcon: z.boolean().optional(),
});

export const narrationAlignmentSchema = z.object({
  characters: z.array(z.string()),
  characterStartTimesSeconds: z.array(z.number()),
  characterEndTimesSeconds: z.array(z.number()),
});

export const storyPageSchema = z.object({
  paragraphs: z.array(z.array(storyTextPartSchema)),
  activity: storyPageActivitySchema.optional(),
  narrationAudioPath: z.string().optional(),
  narrationAlignment: narrationAlignmentSchema.optional(),
  narrationStartSeconds: z.number().optional(),
  narrationEndSeconds: z.number().optional(),
});

export const adaptationContentSchema = z.object({
  pages: z.array(storyPageSchema).min(1),
  storyNarrationAudioPath: z.string().optional(),
  storyNarrationAlignment: narrationAlignmentSchema.optional(),
});

export const quizOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string(),
});

export const quizQuestionSchema = z
  .object({
    id: z.string(),
    type: z.enum(['choice', 'reflection']),
    prompt: z.string(),
    options: z.array(quizOptionSchema),
    correctOptionId: z.string().optional(),
    encouragementCorrect: z.string(),
    encouragementAlmost: z.string(),
  })
  .superRefine((question, ctx) => {
    if (question.options.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cada pergunta precisa de pelo menos 3 opções.',
        path: ['options'],
      });
    }

    if (question.type === 'choice' && !question.correctOptionId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Perguntas de escolha precisam de correctOptionId.',
        path: ['correctOptionId'],
      });
    }

    if (
      question.type === 'choice' &&
      question.correctOptionId &&
      !question.options.some((option) => option.id === question.correctOptionId)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'correctOptionId deve corresponder a uma opção.',
        path: ['correctOptionId'],
      });
    }
  });

export const storyQuizSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  celebrationTitle: z.string(),
  celebrationMessage: z.string(),
  questions: z.array(quizQuestionSchema).min(1),
});

export const userPreferencesSchema = z.object({
  childName: z.string().min(1),
  ageGroup: z.enum(['1-2', '3-4', '5+']),
  themes: z.array(
    z.enum(['animals', 'stars', 'heroes', 'nature', 'music', 'adventure'])
  ),
  languageStyle: languageStyleSchema,
  readingGoal: z.enum(['bedtime', 'prayer', 'learning', 'fun']),
  preferredFormat: z.enum(['story', 'script', 'video']),
  usageFrequency: z.enum(['daily', 'weekend', 'occasionally']),
  bibleVersionId: z.string().min(1),
});

export const generateStoryInputSchema = z.object({
  passageSlug: z.string().min(1),
  bibleVersionId: z.string().min(1),
  verseFrom: z.number().int().positive(),
  verseTo: z.number().int().positive(),
  ageTier: ageTierSchema,
  languageStyle: languageStyleSchema,
  contentType: contentTypeSchema,
  childProfileId: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

export type AdaptationContent = z.infer<typeof adaptationContentSchema>;
export type NarrationAlignment = z.infer<typeof narrationAlignmentSchema>;
export type StoryQuizData = z.infer<typeof storyQuizSchema>;
export type GenerateStoryInput = z.infer<typeof generateStoryInputSchema>;
export type ParsedUserPreferences = z.infer<typeof userPreferencesSchema>;
