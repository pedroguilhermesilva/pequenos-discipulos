import { getActiveProfile, updateProfile } from '@/lib/profiles/storage';
import { DEFAULT_PREFERENCES } from './defaults';
import type { UserPreferences } from './types';

export const PREFERENCES_STORAGE_KEY = 'pequenos-discipulos-preferences';

export function parsePreferences(raw: unknown): UserPreferences | null {
  if (!raw || typeof raw !== 'object') return null;

  const data = raw as Partial<UserPreferences>;
  if (!data.ageGroup || !Array.isArray(data.themes)) return null;

  return {
    childName: data.childName ?? DEFAULT_PREFERENCES.childName,
    ageGroup: data.ageGroup,
    themes: data.themes,
    languageStyle: data.languageStyle ?? DEFAULT_PREFERENCES.languageStyle,
    readingGoal: data.readingGoal ?? DEFAULT_PREFERENCES.readingGoal,
    preferredFormat: data.preferredFormat ?? DEFAULT_PREFERENCES.preferredFormat,
    usageFrequency: data.usageFrequency ?? DEFAULT_PREFERENCES.usageFrequency,
    bibleVersionId: data.bibleVersionId ?? DEFAULT_PREFERENCES.bibleVersionId,
  };
}

export function loadPreferencesFromStorage(): UserPreferences | null {
  if (typeof window === 'undefined') return null;

  const activeProfile = getActiveProfile();
  if (activeProfile) return activeProfile.preferences;

  try {
    const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!stored) return null;
    return parsePreferences(JSON.parse(stored));
  } catch {
    return null;
  }
}

export function savePreferencesToStorage(preferences: UserPreferences): void {
  if (typeof window === 'undefined') return;

  const activeProfile = getActiveProfile();
  if (activeProfile) {
    updateProfile(activeProfile.id, { preferences, name: preferences.childName });
    return;
  }

  localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
}

export function mergePreferences(
  partial: Partial<UserPreferences>,
  base: UserPreferences = DEFAULT_PREFERENCES
): UserPreferences {
  return {
    ...base,
    ...partial,
    themes: partial.themes ?? base.themes,
  };
}
