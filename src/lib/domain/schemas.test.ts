import { describe, expect, it } from 'vitest';
import {
  adaptationContentSchema,
  generateStoryInputSchema,
  storyQuizSchema,
  userPreferencesSchema,
} from '@/lib/domain/schemas';
import { fromPrismaAgeTier, toPrismaAgeTier } from '@/lib/domain/mappers';
import { A_ESTRELA_DE_MATEUS_PAGES } from '@/lib/stories/story-viewer-pages';

describe('domain schemas', () => {
  it('parses adaptation content from viewer pages', () => {
    const parsed = adaptationContentSchema.safeParse({ pages: A_ESTRELA_DE_MATEUS_PAGES });
    expect(parsed.success).toBe(true);
  });

  it('rejects empty adaptation pages', () => {
    const parsed = adaptationContentSchema.safeParse({ pages: [] });
    expect(parsed.success).toBe(false);
  });

  it('parses generate story input', () => {
    const parsed = generateStoryInputSchema.safeParse({
      passageSlug: 'mateus-2-1-3',
      bibleVersionId: '211',
      verseFrom: 1,
      verseTo: 3,
      ageTier: '3-5',
      languageStyle: 'rhymes',
      contentType: 'text',
    });
    expect(parsed.success).toBe(true);
  });

  it('requires bibleVersionId in preferences', () => {
    const parsed = userPreferencesSchema.safeParse({
      childName: 'Davi',
      ageGroup: '3-4',
      themes: ['stars'],
      languageStyle: 'rhymes',
      readingGoal: 'bedtime',
      preferredFormat: 'story',
      usageFrequency: 'daily',
      bibleVersionId: '211',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects quiz questions with fewer than 3 options', () => {
    const parsed = storyQuizSchema.safeParse({
      title: 'Quiz',
      subtitle: 'Sub',
      celebrationTitle: 'Parabéns',
      celebrationMessage: 'Muito bem',
      questions: [
        {
          id: 'q1',
          type: 'choice',
          prompt: 'Pergunta?',
          options: [{ id: 'a', label: 'Só uma', icon: 'star' }],
          correctOptionId: 'a',
          encouragementCorrect: 'Sim',
          encouragementAlmost: 'Quase',
        },
      ],
    });
    expect(parsed.success).toBe(false);
  });
});

describe('age tier mappers', () => {
  it('round-trips age tiers', () => {
    expect(fromPrismaAgeTier(toPrismaAgeTier('3-5'))).toBe('3-5');
    expect(fromPrismaAgeTier(toPrismaAgeTier('6-8'))).toBe('6-8');
    expect(fromPrismaAgeTier(toPrismaAgeTier('9-11'))).toBe('9-11');
  });
});
