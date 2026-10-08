export function shouldBlockOnboardingForExistingUser(input: {
  existingProfilesCount: number;
  isNewProfileMode: boolean;
}): boolean {
  return input.existingProfilesCount > 0 && !input.isNewProfileMode;
}

export function parseNewProfileModeParam(
  modo: string | string[] | undefined
): boolean {
  const value = Array.isArray(modo) ? modo[0] : modo;
  return value === 'novo';
}
