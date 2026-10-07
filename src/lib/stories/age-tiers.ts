import type { AgeGroupId, UserPreferences } from '@/lib/onboarding/types';

export type AgeTier = AgeGroupId;

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

export const DEFAULT_AGE_TIER: AgeTier = '3-5';

export function getAgeTierLabel(tier: AgeTier): string {
  return ageTiers.find((t) => t.id === tier)?.label ?? tier;
}

const LEGACY_AGE_GROUP_MAP: Record<string, AgeTier> = {
  '1-2': '3-5',
  '3-4': '3-5',
  '5+': '6-8',
};

export function migrateAgeGroup(value: string): AgeTier {
  if (value === '3-5' || value === '6-8' || value === '9-11') {
    return value;
  }
  return LEGACY_AGE_GROUP_MAP[value] ?? DEFAULT_AGE_TIER;
}

export function getAgeTierFromAgeGroup(ageGroup: AgeGroupId | string): AgeTier {
  return migrateAgeGroup(ageGroup);
}

export function getAgeTierFromPreferences(preferences: UserPreferences): AgeTier {
  return getAgeTierFromAgeGroup(preferences.ageGroup);
}
