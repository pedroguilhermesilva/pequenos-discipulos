import { describe, expect, it } from 'vitest';
import {
  isProfileRoutingReady,
  shouldRedirectToOnboarding,
  shouldRedirectToProfilePicker,
  shouldTreatProfilesAsUnknown,
} from '@/lib/profiles/profile-guard-logic';

describe('profile-guard-logic', () => {
  it('waits for session and profile load before routing authenticated users', () => {
    expect(isProfileRoutingReady('loading', false)).toBe(false);
    expect(isProfileRoutingReady('authenticated', false)).toBe(false);
    expect(isProfileRoutingReady('authenticated', true)).toBe(true);
    expect(isProfileRoutingReady('unauthenticated', false)).toBe(true);
  });

  it('redirects to onboarding only when profiles are known and empty', () => {
    expect(shouldRedirectToOnboarding({ isReady: false, profilesCount: 0 })).toBe(false);
    expect(shouldRedirectToOnboarding({ isReady: true, profilesCount: 0 })).toBe(true);
    expect(shouldRedirectToOnboarding({ isReady: true, profilesCount: 2 })).toBe(false);
  });

  it('redirects to profile picker when children exist but none is active', () => {
    expect(
      shouldRedirectToProfilePicker({
        isReady: true,
        profilesCount: 2,
        hasActiveProfile: false,
      })
    ).toBe(true);

    expect(
      shouldRedirectToProfilePicker({
        isReady: true,
        profilesCount: 2,
        hasActiveProfile: true,
      })
    ).toBe(false);
  });

  it('treats unauthorized profile responses as unknown, not zero children', () => {
    expect(shouldTreatProfilesAsUnknown(false, 'UNAUTHORIZED')).toBe(true);
    expect(shouldTreatProfilesAsUnknown(false, 'NOT_FOUND')).toBe(false);
    expect(shouldTreatProfilesAsUnknown(true, 'UNAUTHORIZED')).toBe(false);
  });
});
