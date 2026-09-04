import { DEFAULT_PREFERENCES } from '@/lib/onboarding/defaults';
import { parsePreferences, PREFERENCES_STORAGE_KEY } from '@/lib/onboarding/storage';
import type { UserPreferences } from '@/lib/onboarding/types';
import { pickAvatarColor } from './constants';
import { normalizeProfilePreferences } from './normalize';
import type { ChildProfile, ProfilesState } from './types';

export const PROFILES_STORAGE_KEY = 'pequenos-discipulos-profiles';
export const ONBOARDING_DRAFT_KEY = 'pequenos-discipulos-onboarding-draft';

function generateProfileId(): string {
  return `profile-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyState(): ProfilesState {
  return { profiles: [], activeProfileId: null };
}

export function loadProfilesState(): ProfilesState {
  if (typeof window === 'undefined') return emptyState();

  migrateLegacyIfNeeded();

  try {
    const stored = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (!stored) return emptyState();
    const parsed = JSON.parse(stored) as ProfilesState;
    if (!Array.isArray(parsed.profiles)) return emptyState();
    return {
      profiles: parsed.profiles.map(normalizeProfilePreferences),
      activeProfileId: parsed.activeProfileId ?? null,
    };
  } catch {
    return emptyState();
  }
}

export function saveProfilesState(state: ProfilesState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(state));
}

export function migrateLegacyIfNeeded(): void {
  if (typeof window === 'undefined') return;

  const existing = localStorage.getItem(PROFILES_STORAGE_KEY);
  if (existing) {
    try {
      const parsed = JSON.parse(existing) as ProfilesState;
      if (parsed.profiles?.length > 0) return;
    } catch {
      // continue migration
    }
  }

  const legacy = localStorage.getItem(PREFERENCES_STORAGE_KEY);
  if (!legacy) return;

  try {
    const preferences = parsePreferences(JSON.parse(legacy));
    if (!preferences) return;

    const profile = createProfileFromPreferences(preferences);
    saveProfilesState({ profiles: [profile], activeProfileId: profile.id });
  } catch {
    // ignore invalid legacy data
  }
}

export function createProfileFromPreferences(
  preferences: UserPreferences,
  avatarColorIndex?: number
): ChildProfile {
  const state = loadProfilesState();
  const index = avatarColorIndex ?? state.profiles.length;

  return normalizeProfilePreferences({
    id: generateProfileId(),
    name: preferences.childName || DEFAULT_PREFERENCES.childName,
    avatarColor: pickAvatarColor(index),
    preferences: {
      ...preferences,
      childName: preferences.childName || DEFAULT_PREFERENCES.childName,
    },
    createdAt: new Date().toISOString(),
  });
}

export function addProfile(preferences: UserPreferences): ChildProfile {
  const state = loadProfilesState();
  const profile = createProfileFromPreferences(preferences);
  const next: ProfilesState = {
    profiles: [...state.profiles, profile],
    activeProfileId: profile.id,
  };
  saveProfilesState(next);
  return profile;
}

export function updateProfile(
  profileId: string,
  updates: Partial<Pick<ChildProfile, 'name' | 'avatarColor' | 'preferences' | 'hasCreatedStory'>>
): ChildProfile | null {
  const state = loadProfilesState();
  const index = state.profiles.findIndex((p) => p.id === profileId);
  if (index === -1) return null;

  const current = state.profiles[index];
  const updated: ChildProfile = normalizeProfilePreferences({
    ...current,
    ...updates,
    preferences: updates.preferences
      ? { ...current.preferences, ...updates.preferences }
      : current.preferences,
    name: updates.name ?? updates.preferences?.childName ?? current.name,
  });

  const profiles = [...state.profiles];
  profiles[index] = updated;
  saveProfilesState({ ...state, profiles });
  return updated;
}

export function deleteProfile(profileId: string): boolean {
  const state = loadProfilesState();
  if (state.profiles.length <= 1) return false;

  const profiles = state.profiles.filter((p) => p.id !== profileId);
  const activeProfileId =
    state.activeProfileId === profileId
      ? profiles[0]?.id ?? null
      : state.activeProfileId;

  saveProfilesState({ profiles, activeProfileId });
  return true;
}

export function getActiveProfile(): ChildProfile | null {
  const state = loadProfilesState();
  if (!state.activeProfileId) return null;
  return state.profiles.find((p) => p.id === state.activeProfileId) ?? null;
}

export function setActiveProfile(profileId: string): ChildProfile | null {
  const state = loadProfilesState();
  const profile = state.profiles.find((p) => p.id === profileId);
  if (!profile) return null;

  saveProfilesState({ ...state, activeProfileId: profileId });
  return profile;
}

export function markProfileHasCreatedStory(profileId: string): ChildProfile | null {
  return updateProfile(profileId, { hasCreatedStory: true });
}

export function hasProfiles(): boolean {
  return loadProfilesState().profiles.length > 0;
}

export function loadOnboardingDraft(): UserPreferences | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(ONBOARDING_DRAFT_KEY);
    if (!stored) return null;
    return parsePreferences(JSON.parse(stored));
  } catch {
    return null;
  }
}

export function saveOnboardingDraft(preferences: UserPreferences): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(preferences));
}

export function clearOnboardingDraft(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ONBOARDING_DRAFT_KEY);
}

export function clearLocalSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PROFILES_STORAGE_KEY);
  localStorage.removeItem(ONBOARDING_DRAFT_KEY);
  localStorage.removeItem(PREFERENCES_STORAGE_KEY);
}
