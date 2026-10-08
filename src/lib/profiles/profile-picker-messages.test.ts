import { describe, expect, it } from 'vitest';
import {
  getProfileSwitchStatusLabel,
  PROFILE_SWITCH_ERROR,
} from '@/lib/profiles/profile-picker-messages';

describe('profile-picker-messages', () => {
  it('builds the screen-reader status while switching profiles', () => {
    expect(getProfileSwitchStatusLabel('João')).toBe('Trocando para João...');
  });

  it('exposes a friendly error when the switch fails', () => {
    expect(PROFILE_SWITCH_ERROR).toMatch(/trocar de perfil/i);
  });
});
