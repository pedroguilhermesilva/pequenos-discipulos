import { describe, expect, it, vi } from 'vitest';
import { UnauthorizedError } from '@/lib/domain/errors';
import { isAdminUser, requireAdmin } from '@/lib/auth/require-admin';

vi.mock('@/lib/auth/get-current-user', () => ({
  requireCurrentUser: vi.fn(),
}));

import { requireCurrentUser } from '@/lib/auth/get-current-user';

describe('isAdminUser', () => {
  it('returns true when isAdmin is true', () => {
    expect(isAdminUser({ isAdmin: true })).toBe(true);
  });

  it('returns false when isAdmin is false', () => {
    expect(isAdminUser({ isAdmin: false })).toBe(false);
  });
});

describe('requireAdmin', () => {
  it('allows users with isAdmin true', async () => {
    vi.mocked(requireCurrentUser).mockResolvedValue({
      id: 'admin-1',
      isAdmin: true,
    } as never);

    const user = await requireAdmin();
    expect(user.id).toBe('admin-1');
  });

  it('denies users with isAdmin false', async () => {
    vi.mocked(requireCurrentUser).mockResolvedValue({
      id: 'user-1',
      isAdmin: false,
    } as never);

    await expect(requireAdmin()).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
