import { describe, expect, it } from 'vitest';
import {
  parseNewProfileModeParam,
  shouldBlockOnboardingForExistingUser,
} from '@/lib/onboarding/guard-logic';

describe('onboarding guard-logic', () => {
  it('blocks onboarding when the account already has children and modo is not novo', () => {
    expect(
      shouldBlockOnboardingForExistingUser({
        existingProfilesCount: 2,
        isNewProfileMode: false,
      })
    ).toBe(true);
  });

  it('allows onboarding for accounts without children', () => {
    expect(
      shouldBlockOnboardingForExistingUser({
        existingProfilesCount: 0,
        isNewProfileMode: false,
      })
    ).toBe(false);
  });

  it('allows onboarding in add-child mode even when children already exist', () => {
    expect(
      shouldBlockOnboardingForExistingUser({
        existingProfilesCount: 1,
        isNewProfileMode: true,
      })
    ).toBe(false);
  });

  it('parses modo=novo from search params', () => {
    expect(parseNewProfileModeParam('novo')).toBe(true);
    expect(parseNewProfileModeParam(['novo'])).toBe(true);
    expect(parseNewProfileModeParam(undefined)).toBe(false);
    expect(parseNewProfileModeParam('outro')).toBe(false);
  });
});
