import type { StorySummary } from '@/lib/stories';
import { STORY_IMAGE } from '@/lib/stories';
import { getAgeGroupLabel, getThemeLabel } from '@/lib/onboarding/constants';
import { DEFAULT_PREFERENCES } from '@/lib/onboarding/defaults';
import type { UserPreferences } from '@/lib/onboarding/types';
import { buildStoryUrl } from './story-url';

/** Reserved ID for stories being created for the first time */
export const NEW_STORY_ID = 'nova';

export function isNewStoryId(id: string): boolean {
  return id === NEW_STORY_ID;
}

export function getNewStoryHref(): string {
  return buildStoryUrl(NEW_STORY_ID);
}

export const NEW_STORY_PAGE_HREF = '/nova-historia';

/** Intro page on first story; passage picker on subsequent creations */
export function getNewStoryEntryHref(hasCreatedStory = false): string {
  return hasCreatedStory ? getNewStoryHref() : NEW_STORY_PAGE_HREF;
}

export function createNewStoryPlaceholder(preferences: UserPreferences = DEFAULT_PREFERENCES): StorySummary {
  return {
    id: NEW_STORY_ID,
    title: `História para ${preferences.childName}`,
    ageGroup: getAgeGroupLabel(preferences.ageGroup),
    passage: '',
    progress: 0,
    totalPages: 4,
    image: STORY_IMAGE,
    themes: preferences.themes.map(getThemeLabel),
  };
}
