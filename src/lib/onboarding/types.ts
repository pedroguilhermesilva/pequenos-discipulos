export type AgeGroupId = '1-2' | '3-4' | '5+';
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
  /** YouVersion Bible version id */
  bibleVersionId: string;
}
