import type { AgeGroupId, UserPreferences } from '@/lib/onboarding/types';

export type AgeTier = '3-5' | '6-8' | '9-11';

export const ageTiers: Array<{
  id: AgeTier;
  label: string;
  emoji: string;
  subtitle: string;
}> = [
  { id: '3-5', label: '3 a 5 anos', emoji: '👶', subtitle: 'Sensorial' },
  { id: '6-8', label: '6 a 8 anos', emoji: '🎈', subtitle: 'Narrativo' },
  { id: '9-11', label: '9 a 11 anos', emoji: '🧭', subtitle: 'Aventura' },
];

export const DEFAULT_AGE_TIER: AgeTier = '6-8';

export function getAgeTierLabel(tier: AgeTier): string {
  return ageTiers.find((t) => t.id === tier)?.label ?? tier;
}

export function getAgeTierFromAgeGroup(ageGroup: AgeGroupId): AgeTier {
  switch (ageGroup) {
    case '1-2':
    case '3-4':
      return '3-5';
    case '5+':
      return '6-8';
    default:
      return DEFAULT_AGE_TIER;
  }
}

export function getAgeTierFromPreferences(preferences: UserPreferences): AgeTier {
  const tier = getAgeTierFromAgeGroup(preferences.ageGroup);

  if (preferences.ageGroup === '5+' && preferences.languageStyle === 'adventure') {
    return '9-11';
  }

  return tier;
}
