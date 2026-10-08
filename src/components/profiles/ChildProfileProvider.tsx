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
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import type { UserPreferences } from '@/lib/onboarding/types';
import {
  addProfile,
  deleteProfile as deleteLocalProfile,
  getActiveProfile,
  loadProfilesState,
  replaceProfilesState,
  updateProfile,
} from '@/lib/profiles/storage';
import {
  createChildProfileAction,
  deleteChildProfileAction,
  getActiveChildProfileIdAction,
  listChildProfilesAction,
  migrateLocalProfilesAction,
  setActiveChildProfile,
} from '@/lib/profiles/actions';
import { parsePreferences } from '@/lib/onboarding/storage';
import { DEFAULT_PREFERENCES } from '@/lib/onboarding/defaults';
import {
  isProfileRoutingReady,
  shouldTreatProfilesAsUnknown,
} from '@/lib/profiles/profile-guard-logic';
import type { ChildProfile, ProfileAvatarColorId } from '@/lib/profiles/types';

export type RemoveProfileResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

interface ChildProfileContextValue {
  profiles: ChildProfile[];
  activeProfile: ChildProfile | null;
  isReady: boolean;
  refresh: () => Promise<void>;
  selectProfile: (profileId: string) => Promise<ChildProfile | null>;
  createProfile: (preferences: UserPreferences) => ChildProfile;
  updateActivePreferences: (preferences: UserPreferences) => void;
  updateProfileById: (
    profileId: string,
    updates: Partial<Pick<ChildProfile, 'name' | 'avatarColor' | 'preferences' | 'hasCreatedStory'>>
  ) => void;
  removeProfile: (profileId: string) => Promise<RemoveProfileResult>;
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

function resolveActiveProfile(
  profiles: ChildProfile[],
  activeProfileId: string | null
): ChildProfile | null {
  if (activeProfileId) {
    return profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0] ?? null;
  }
  return profiles[0] ?? null;
}

export function ChildProfileProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, status: sessionStatus } = useSession();
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<ChildProfile | null>(null);
  const [profilesLoaded, setProfilesLoaded] = useState(false);

  const isAuthenticated = sessionStatus === 'authenticated';
  const isReady = isProfileRoutingReady(sessionStatus, profilesLoaded);

  const syncProfiles = useCallback((mapped: ChildProfile[], activeProfileId: string | null) => {
    const active = resolveActiveProfile(mapped, activeProfileId);
    setProfiles(mapped);
    setActiveProfile(active);
    replaceProfilesState(mapped, active?.id ?? null);
    setProfilesLoaded(true);
    return active;
  }, []);

  const loadFromServer = useCallback(async () => {
    const result = await listChildProfilesAction();

    if (result.ok) {
      const mapped = result.data.map(mapDbProfile);
      const activeResult = await getActiveChildProfileIdAction();
      const activeProfileId = activeResult.ok ? activeResult.data.profileId : null;
      syncProfiles(mapped, activeProfileId);
      return;
    }

    if (shouldTreatProfilesAsUnknown(result.ok, result.code)) {
      setProfiles([]);
      setActiveProfile(null);
      setProfilesLoaded(false);
      return;
    }

    const state = loadProfilesState();
    if (state.profiles.length > 0) {
      setProfiles(state.profiles);
      setActiveProfile(getActiveProfile());
      setProfilesLoaded(true);
      return;
    }

    setProfiles([]);
    setActiveProfile(null);
    setProfilesLoaded(true);
  }, [syncProfiles]);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setProfiles([]);
      setActiveProfile(null);
      setProfilesLoaded(false);
      return;
    }

    setProfilesLoaded(false);
    await loadFromServer();
  }, [isAuthenticated, loadFromServer]);

  useEffect(() => {
    if (sessionStatus === 'loading') return;

    if (!isAuthenticated) {
      setProfiles([]);
      setActiveProfile(null);
      setProfilesLoaded(false);
      return;
    }

    let cancelled = false;
    setProfilesLoaded(false);

    async function bootForUser() {
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
      await loadFromServer();
    }

    void bootForUser();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, sessionStatus, isAuthenticated, loadFromServer]);

  const selectProfile = useCallback(
    async (profileId: string) => {
      const active = syncProfiles(profiles, profileId);
      if (!active) return null;

      void setActiveChildProfile(profileId).then(async (result) => {
        if (!result.ok) {
          await refresh();
          return;
        }
        void queryClient.invalidateQueries({ queryKey: ['library'] });
      });

      return active;
    },
    [profiles, syncProfiles, refresh, queryClient]
  );

  const createProfile = useCallback(
    (preferences: UserPreferences) => {
      const localProfile = addProfile(preferences);
      void (async () => {
        const result = await createChildProfileAction({
          id: localProfile.id,
          name: localProfile.name,
          avatarColor: localProfile.avatarColor,
          preferences: localProfile.preferences,
        });
        if (result.ok) {
          const setResult = await setActiveChildProfile(result.data.id);
          if (setResult.ok) {
            const listResult = await listChildProfilesAction();
            if (listResult.ok) {
              syncProfiles(
                listResult.data.map(mapDbProfile),
                setResult.data.profileId
              );
            }
          }
        }
        await queryClient.invalidateQueries({ queryKey: ['library'] });
        router.refresh();
      })();
      return localProfile;
    },
    [syncProfiles, queryClient, router]
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
    async (profileId: string): Promise<RemoveProfileResult> => {
      const deletedName =
        profiles.find((profile) => profile.id === profileId)?.name ?? 'Perfil';

      const result = await deleteChildProfileAction(profileId);
      if (!result.ok) {
        return { ok: false, message: result.message };
      }

      deleteLocalProfile(profileId);

      const listResult = await listChildProfilesAction();
      if (listResult.ok) {
        syncProfiles(listResult.data.map(mapDbProfile), result.data.activeProfileId);
      } else {
        await refresh();
      }

      await queryClient.invalidateQueries({ queryKey: ['library'] });
      router.refresh();

      return {
        ok: true,
        message: `Perfil de ${deletedName} excluído com sucesso.`,
      };
    },
    [refresh, router, profiles, syncProfiles, queryClient]
  );

  const value = useMemo(
    () => ({
      profiles,
      activeProfile,
      isReady,
      refresh,
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
