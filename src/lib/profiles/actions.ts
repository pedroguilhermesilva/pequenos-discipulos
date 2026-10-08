'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  ACTIVE_CHILD_COOKIE,
  getCurrentChildProfileId,
  getCurrentUserId,
  requireCurrentUser,
} from '@/lib/auth/get-current-user';
import { toActionError, type ActionResult } from '@/lib/domain/errors';
import { container } from '@/lib/container';
import type { UserPreferences } from '@/lib/onboarding/types';
import type { ProfileAvatarColorId } from '@/lib/profiles/types';

export async function setActiveChildProfile(
  profileId: string
): Promise<ActionResult<{ profileId: string }>> {
  try {
    const user = await requireCurrentUser();
    const profile = await container.services.childProfiles.findById(profileId);
    if (!profile || profile.userId !== user.id) {
      return { ok: false, code: 'NOT_FOUND', message: 'Perfil não encontrado.' };
    }

    const jar = await cookies();
    jar.set(ACTIVE_CHILD_COOKIE, profileId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    revalidatePath('/');
    revalidatePath('/home');
    revalidatePath('/perfis');
    revalidatePath('/configuracoes');
    revalidatePath('/biblioteca');
    revalidatePath('/nova-historia');
    return { ok: true, data: { profileId } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getActiveChildProfileIdAction(): Promise<
  ActionResult<{ profileId: string | null }>
> {
  try {
    await requireCurrentUser();
    const profileId = await getCurrentChildProfileId();
    return { ok: true, data: { profileId } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteChildProfileAction(
  profileId: string
): Promise<ActionResult<{ deletedId: string; activeProfileId: string | null }>> {
  try {
    const user = await requireCurrentUser();
    const profile = await container.services.childProfiles.findById(profileId);
    if (!profile || profile.userId !== user.id) {
      return { ok: false, code: 'NOT_FOUND', message: 'Perfil não encontrado.' };
    }

    await container.services.childProfiles.delete(user.id, profileId);

    const jar = await cookies();
    const currentActive = jar.get(ACTIVE_CHILD_COOKIE)?.value ?? null;
    let activeProfileId = currentActive;

    if (currentActive === profileId) {
      const remaining = await container.services.childProfiles.list(user.id);
      activeProfileId = remaining[0]?.id ?? null;
      if (activeProfileId) {
        jar.set(ACTIVE_CHILD_COOKIE, activeProfileId, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
        });
      } else {
        jar.delete(ACTIVE_CHILD_COOKIE);
      }
    }

    revalidatePath('/');
    revalidatePath('/home');
    revalidatePath('/perfis');
    revalidatePath('/configuracoes');
    revalidatePath('/biblioteca');
    revalidatePath('/nova-historia');

    return { ok: true, data: { deletedId: profileId, activeProfileId } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function listChildProfilesAction() {
  try {
    const user = await requireCurrentUser();
    const profiles = await container.services.childProfiles.list(user.id);
    return { ok: true as const, data: profiles };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createChildProfileAction(input: {
  name: string;
  avatarColor: ProfileAvatarColorId;
  preferences: UserPreferences;
  id?: string;
}) {
  try {
    const user = await requireCurrentUser();
    const profile = await container.services.childProfiles.create(
      user.id,
      user.subscriptionTier,
      input
    );
    revalidatePath('/perfis');
    revalidatePath('/configuracoes');
    return { ok: true as const, data: profile };
  } catch (error) {
    return toActionError(error);
  }
}

export async function migrateLocalProfilesAction(
  profiles: Array<{
    id: string;
    name: string;
    avatarColor: ProfileAvatarColorId;
    preferences: UserPreferences;
    hasCreatedStory?: boolean;
  }>
) {
  try {
    const user = await requireCurrentUser();
    const migrated = await container.services.childProfiles.migrateFromLocal(
      user.id,
      user.subscriptionTier,
      profiles
    );

    if (migrated[0]) {
      const jar = await cookies();
      jar.set(ACTIVE_CHILD_COOKIE, migrated[0].id, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      });
    }

    return { ok: true as const, data: migrated };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateChildPreferencesAction(
  profileId: string,
  preferences: UserPreferences
) {
  try {
    const userId = await getCurrentUserId();
    const profile = await container.services.childProfiles.findById(profileId);
    if (!profile || profile.userId !== userId) {
      return { ok: false as const, code: 'NOT_FOUND' as const, message: 'Perfil não encontrado.' };
    }

    const updated = await container.services.childProfiles.updatePreferences(
      profileId,
      preferences
    );
    revalidatePath('/configuracoes');
    return { ok: true as const, data: updated };
  } catch (error) {
    return toActionError(error);
  }
}
