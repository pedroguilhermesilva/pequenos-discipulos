import type { UserPreferences } from '@/lib/onboarding/types';

export type ProfileAvatarColorId = 'laranja' | 'vida' | 'dourado' | 'ceu' | 'amber';

export interface ChildProfile {
  id: string;
  name: string;
  avatarColor: ProfileAvatarColorId;
  preferences: UserPreferences;
  createdAt: string;
  /** True after the profile completes their first story generation */
  hasCreatedStory?: boolean;
}

export interface ProfilesState {
  profiles: ChildProfile[];
  activeProfileId: string | null;
}
