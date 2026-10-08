export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

export function isProfileRoutingReady(
  sessionStatus: SessionStatus,
  profilesLoaded: boolean
): boolean {
  if (sessionStatus === 'loading') return false;
  if (sessionStatus === 'unauthenticated') return true;
  return profilesLoaded;
}

export function shouldRedirectToOnboarding(input: {
  isReady: boolean;
  profilesCount: number;
}): boolean {
  return input.isReady && input.profilesCount === 0;
}

export function shouldRedirectToProfilePicker(input: {
  isReady: boolean;
  profilesCount: number;
  hasActiveProfile: boolean;
}): boolean {
  return input.isReady && input.profilesCount > 0 && !input.hasActiveProfile;
}

export function shouldTreatProfilesAsUnknown(
  actionOk: boolean,
  actionCode?: string
): boolean {
  return !actionOk && actionCode === 'UNAUTHORIZED';
}
