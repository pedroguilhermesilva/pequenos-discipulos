import { redirect } from 'next/navigation';
import { requireCurrentUser } from '@/lib/auth/get-current-user';
import { container } from '@/lib/container';
import {
  parseNewProfileModeParam,
  shouldBlockOnboardingForExistingUser,
} from '@/lib/onboarding/guard-logic';

export async function ensureOnboardingAccess(searchParams: {
  modo?: string | string[] | undefined;
}) {
  const isNewProfileMode = parseNewProfileModeParam(searchParams.modo);
  const user = await requireCurrentUser();
  const profiles = await container.services.childProfiles.list(user.id);

  if (
    shouldBlockOnboardingForExistingUser({
      existingProfilesCount: profiles.length,
      isNewProfileMode,
    })
  ) {
    redirect('/home');
  }
}
