'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { UserPreferences } from '@/lib/onboarding/types';
import {
  addProfile,
  deleteProfile,
  getActiveProfile,
  loadProfilesState,
  setActiveProfile as setActiveProfileStorage,
  updateProfile,
} from '@/lib/profiles/storage';
import {
  createChildProfileAction,
  listChildProfilesAction,
  migrateLocalProfilesAction,
  setActiveChildProfile,
} from '@/lib/profiles/actions';
import { parsePreferences } from '@/lib/onboarding/storage';
import { DEFAULT_PREFERENCES } from '@/lib/onboarding/defaults';
import type { ChildProfile, ProfileAvatarColorId } from '@/lib/profiles/types';

interface ChildProfileContextValue {
  profiles: ChildProfile[];
  activeProfile: ChildProfile | null;
  isReady: boolean;
  refresh: () => void;
  selectProfile: (profileId: string) => ChildProfile | null;
  createProfile: (preferences: UserPreferences) => ChildProfile;
  updateActivePreferences: (preferences: UserPreferences) => void;
  updateProfileById: (
    profileId: string,
    updates: Partial<Pick<ChildProfile, 'name' | 'avatarColor' | 'preferences' | 'hasCreatedStory'>>
  ) => void;
  removeProfile: (profileId: string) => boolean;
}

const ChildProfileContext = createContext<ChildProfileContextValue | null>(null);

function mapDbProfile(row: {
  id: string;
  name: string;
  avatarColor: string;
  preferences: unknown;
  hasCreatedStory: boolean;
  createdAt: Date | string;
}): ChildProfile {
  return {
    id: row.id,
    name: row.name,
    avatarColor: row.avatarColor as ProfileAvatarColorId,
    preferences: parsePreferences(row.preferences) ?? {
      ...DEFAULT_PREFERENCES,
      childName: row.name,
    },
    hasCreatedStory: row.hasCreatedStory,
    createdAt: typeof row.createdAt === 'string' ? row.createdAt : row.createdAt.toISOString(),
  };
}

export function ChildProfileProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<ChildProfile | null>(null);
  const [isReady, setIsReady] = useState(false);

  const refreshLocal = useCallback(() => {
    const state = loadProfilesState();
    setProfiles(state.profiles);
    setActiveProfile(getActiveProfile());
    setIsReady(true);
  }, []);

  const refresh = useCallback(async () => {
    const result = await listChildProfilesAction();
    if (result.ok && result.data.length > 0) {
      const mapped = result.data.map(mapDbProfile);
      setProfiles(mapped);
      const activeId = getActiveProfile()?.id;
      setActiveProfile(mapped.find((p) => p.id === activeId) ?? mapped[0] ?? null);
      setIsReady(true);
      return;
    }
    refreshLocal();
  }, [refreshLocal]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const local = loadProfilesState();
      if (local.profiles.length > 0) {
        await migrateLocalProfilesAction(
          local.profiles.map((p) => ({
            id: p.id,
            name: p.name,
            avatarColor: p.avatarColor,
            preferences: p.preferences,
            hasCreatedStory: p.hasCreatedStory,
          }))
        );
      }

      if (cancelled) return;
      await refresh();
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const selectProfile = useCallback(
    (profileId: string) => {
      const profile = setActiveProfileStorage(profileId);
      void setActiveChildProfile(profileId);
      void refresh();
      return profile;
    },
    [refresh]
  );

  const createProfile = useCallback(
    (preferences: UserPreferences) => {
      const profile = addProfile(preferences);
      void createChildProfileAction({
        id: profile.id,
        name: profile.name,
        avatarColor: profile.avatarColor,
        preferences: profile.preferences,
      }).then(() => setActiveChildProfile(profile.id));
      void refresh();
      return profile;
    },
    [refresh]
  );

  const updateActivePreferences = useCallback(
    (preferences: UserPreferences) => {
      const active = getActiveProfile();
      if (!active) return;
      updateProfile(active.id, { preferences, name: preferences.childName });
      void refresh();
    },
    [refresh]
  );

  const updateProfileById = useCallback(
    (
      profileId: string,
      updates: Partial<Pick<ChildProfile, 'name' | 'avatarColor' | 'preferences' | 'hasCreatedStory'>>
    ) => {
      updateProfile(profileId, updates);
      void refresh();
    },
    [refresh]
  );

  const removeProfile = useCallback(
    (profileId: string) => {
      const removed = deleteProfile(profileId);
      if (removed) void refresh();
      return removed;
    },
    [refresh]
  );

  const value = useMemo(
    () => ({
      profiles,
      activeProfile,
      isReady,
      refresh: () => {
        void refresh();
      },
      selectProfile,
      createProfile,
      updateActivePreferences,
      updateProfileById,
      removeProfile,
    }),
    [
      profiles,
      activeProfile,
      isReady,
      refresh,
      selectProfile,
      createProfile,
      updateActivePreferences,
      updateProfileById,
      removeProfile,
    ]
  );

  return (
    <ChildProfileContext.Provider value={value}>{children}</ChildProfileContext.Provider>
  );
}

export function useChildProfiles() {
  const context = useContext(ChildProfileContext);
  if (!context) {
    throw new Error('useChildProfiles must be used within ChildProfileProvider');
  }
  return context;
}

export function useActivePreferences(): UserPreferences | null {
  const { activeProfile } = useChildProfiles();
  return activeProfile?.preferences ?? null;
}
