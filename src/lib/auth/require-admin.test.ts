import { afterEach, describe, expect, it, vi } from 'vitest';
import { isAdminEmail } from '@/lib/auth/require-admin';

describe('isAdminEmail', () => {
  afterEach(() => {
    delete process.env.ADMIN_EMAILS;
  });

  it('returns true for allowlisted emails', () => {
    process.env.ADMIN_EMAILS = 'pedro@example.com, admin@test.local';
    expect(isAdminEmail('pedro@example.com')).toBe(true);
    expect(isAdminEmail('ADMIN@test.local')).toBe(true);
  });

  it('returns false for non-admin emails', () => {
    process.env.ADMIN_EMAILS = 'pedro@example.com';
    expect(isAdminEmail('other@example.com')).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
  });
});
