import type { UserPreferences } from './types';
import { DEFAULT_BIBLE_VERSION_ID } from '@/lib/stories/bible-versions';

export const DEFAULT_PREFERENCES: UserPreferences = {
  childName: 'Davi',
  ageGroup: '3-4',
  themes: ['stars', 'music'],
  languageStyle: 'rhymes',
  readingGoal: 'bedtime',
  preferredFormat: 'story',
  usageFrequency: 'daily',
  bibleVersionId: DEFAULT_BIBLE_VERSION_ID,
};
