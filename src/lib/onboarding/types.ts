/** Aligned with adaptation tiers and Prisma AgeTier mapping. */
export type AgeGroupId = '3-5' | '6-8' | '9-11';
export type ThemeId = 'animals' | 'stars' | 'heroes' | 'nature' | 'music' | 'adventure';
export type LanguageStyleId = 'simple' | 'rhymes' | 'adventure';
export type ReadingGoalId = 'bedtime' | 'prayer' | 'learning' | 'fun';
export type PreferredFormatId = 'story' | 'script' | 'video';
export type UsageFrequencyId = 'daily' | 'weekend' | 'occasionally';

export interface UserPreferences {
  childName: string;
  ageGroup: AgeGroupId;
  themes: ThemeId[];
  languageStyle: LanguageStyleId;
  readingGoal: ReadingGoalId;
  preferredFormat: PreferredFormatId;
  usageFrequency: UsageFrequencyId;
  /** Local Bible version id (Almeida 1911). */
  bibleVersionId: string;
}
