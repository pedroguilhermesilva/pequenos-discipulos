import { beforeEach, describe, expect, it, vi } from 'vitest';

const redirectMock = vi.fn((path: string) => {
  throw new Error(`redirect:${path}`);
});
const listMock = vi.fn();

vi.mock('next/navigation', () => ({
  redirect: (path: string) => redirectMock(path),
}));

vi.mock('@/lib/auth/get-current-user', () => ({
  requireCurrentUser: vi.fn(async () => ({ id: 'user-1' })),
}));

vi.mock('@/lib/container', () => ({
  container: {
    services: {
      childProfiles: {
        list: (...args: unknown[]) => listMock(...args),
      },
    },
  },
}));

import { ensureOnboardingAccess } from '@/lib/onboarding/guard';

describe('ensureOnboardingAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to home when the user already has children and is not adding a new profile', async () => {
    listMock.mockResolvedValue([{ id: 'child-1' }]);

    await expect(ensureOnboardingAccess({})).rejects.toThrow('redirect:/home');
    expect(redirectMock).toHaveBeenCalledWith('/home');
  });

  it('allows onboarding when the account has no children', async () => {
    listMock.mockResolvedValue([]);

    await expect(ensureOnboardingAccess({})).resolves.toBeUndefined();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('allows onboarding in add-child mode even when children already exist', async () => {
    listMock.mockResolvedValue([{ id: 'child-1' }, { id: 'child-2' }]);

    await expect(ensureOnboardingAccess({ modo: 'novo' })).resolves.toBeUndefined();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
