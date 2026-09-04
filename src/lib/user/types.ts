import type { UserPreferences } from '@/lib/onboarding/types';
import type { UsageLimitsResult } from './usage-limits';

export interface UserAccount {
  id: string | null;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface UserSettings {
  account: UserAccount;
  preferences: UserPreferences;
  usage: UsageLimitsResult;
  isDemo: boolean;
}
