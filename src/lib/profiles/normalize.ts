import type { ChildProfile } from './types';
import type { UserPreferences } from '@/lib/onboarding/types';

export function normalizeProfilePreferences(profile: ChildProfile): ChildProfile {
  const name = profile.name || profile.preferences.childName;
  const childName = profile.preferences.childName || profile.name;
  const hasCreatedStory = profile.hasCreatedStory ?? false;

  if (
    name === profile.name &&
    childName === profile.preferences.childName &&
    hasCreatedStory === profile.hasCreatedStory
  ) {
    return { ...profile, hasCreatedStory };
  }

  return {
    ...profile,
    name,
    hasCreatedStory,
    preferences: {
      ...profile.preferences,
      childName,
    },
  };
}

export function getProfileDisplayName(profile: ChildProfile): string {
  return profile.preferences.childName || profile.name;
}

export function withSyncedPreferences(
  preferences: UserPreferences,
  name?: string
): UserPreferences {
  const childName = preferences.childName || name || '';
  return { ...preferences, childName };
}
