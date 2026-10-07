import { beforeEach, describe, expect, it, vi } from 'vitest';

const signOutMock = vi.fn();
const clearLocalSessionMock = vi.fn();

vi.mock('next-auth/react', () => ({
  signOut: (...args: unknown[]) => signOutMock(...args),
}));

vi.mock('@/lib/profiles/storage', () => ({
  clearLocalSession: () => clearLocalSessionMock(),
}));

import { performClientSignOut } from '@/lib/auth/sign-out-client';

describe('performClientSignOut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signOutMock.mockResolvedValue(undefined);
  });

  it('clears local session and ends the NextAuth session with redirect to login', async () => {
    await performClientSignOut();

    expect(clearLocalSessionMock).toHaveBeenCalledOnce();
    expect(signOutMock).toHaveBeenCalledOnce();
    expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: '/login' });
  });

  it('clears local session before calling NextAuth signOut', async () => {
    const callOrder: string[] = [];
    clearLocalSessionMock.mockImplementation(() => {
      callOrder.push('clear');
    });
    signOutMock.mockImplementation(async () => {
      callOrder.push('signOut');
    });

    await performClientSignOut();

    expect(callOrder).toEqual(['clear', 'signOut']);
  });
});
