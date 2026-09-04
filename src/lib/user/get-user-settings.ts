import {
  getCurrentChildProfileId,
  requireCurrentUser,
} from '@/lib/auth/get-current-user';
import { container } from '@/lib/container';
import { DEFAULT_PREFERENCES } from '@/lib/onboarding/defaults';
import { parsePreferences } from '@/lib/onboarding/storage';
import { buildUsageLimits } from '@/lib/user/usage-limits';
import type { UserSettings } from '@/lib/user/types';

export async function getUserSettings(): Promise<UserSettings> {
  const user = await requireCurrentUser();
  const childId = await getCurrentChildProfileId();
  const child = childId
    ? await container.services.childProfiles.findById(childId)
    : (await container.services.childProfiles.list(user.id))[0];

  const preferences = child
    ? (parsePreferences(child.preferences) ?? {
        ...DEFAULT_PREFERENCES,
        childName: child.name,
      })
    : DEFAULT_PREFERENCES;

  const usageCounts = await container.services.planLimits.getUsage(user.id);

  return {
    account: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: null,
    },
    preferences,
    usage: buildUsageLimits(user.subscriptionTier, usageCounts),
    isDemo: false,
  };
}
