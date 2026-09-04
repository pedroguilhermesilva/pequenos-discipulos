'use server';

import { revalidatePath } from 'next/cache';
import { requireCurrentUser, getCurrentChildProfileId } from '@/lib/auth/get-current-user';
import { container } from '@/lib/container';
import { toActionError } from '@/lib/domain/errors';
import { parsePreferences } from '@/lib/onboarding/storage';
import type { UserPreferences } from '@/lib/onboarding/types';

export interface SaveSettingsResult {
  success: boolean;
  error?: string;
}

export async function saveUserPreferences(
  preferences: UserPreferences
): Promise<SaveSettingsResult> {
  const parsed = parsePreferences(preferences);
  if (!parsed) {
    return { success: false, error: 'Preferências inválidas.' };
  }

  try {
    const user = await requireCurrentUser();
    const childId = await getCurrentChildProfileId();
    const profile =
      (childId ? await container.services.childProfiles.findById(childId) : null) ??
      (await container.services.childProfiles.list(user.id))[0];

    if (profile) {
      await container.services.childProfiles.updatePreferences(profile.id, {
        ...parsed,
        bibleVersionId: preferences.bibleVersionId ?? parsed.bibleVersionId,
      });
    }

    revalidatePath('/configuracoes');
    revalidatePath('/home');
    return { success: true };
  } catch (error) {
    const result = toActionError(error);
    return { success: false, error: result.ok ? undefined : result.message };
  }
}

export async function saveUserProfile(data: {
  fullName: string;
}): Promise<SaveSettingsResult> {
  const fullName = data.fullName.trim();
  if (!fullName) {
    return { success: false, error: 'O nome não pode estar vazio.' };
  }

  try {
    const user = await requireCurrentUser();
    await container.prisma.user.update({
      where: { id: user.id },
      data: { fullName },
    });
    revalidatePath('/configuracoes');
    return { success: true };
  } catch (error) {
    const result = toActionError(error);
    return { success: false, error: result.ok ? undefined : result.message };
  }
}
