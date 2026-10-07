import { beforeEach, describe, expect, it, vi } from 'vitest';
import { syncOAuthUserFullName } from '@/lib/auth/oauth-user';
import { resolveUserDisplayName } from '@/lib/user/display-name';

describe('OAuth user profile sync', () => {
  const prisma = {
    user: {
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.user.updateMany).mockResolvedValue({ count: 1 });
  });

  it('syncOAuthUserFullName copies OAuth name into fullName when missing', async () => {
    await syncOAuthUserFullName(prisma as never, 'user-oauth-1', 'Maria Google');

    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'user-oauth-1', fullName: null },
      data: { fullName: 'Maria Google' },
    });
  });

  it('syncOAuthUserFullName skips empty names', async () => {
    await syncOAuthUserFullName(prisma as never, 'user-oauth-1', '   ');

    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });

  it('resolveUserDisplayName prefers fullName over OAuth name', () => {
    expect(
      resolveUserDisplayName({ fullName: 'Conta App', name: 'Google Name' })
    ).toBe('Conta App');
  });

  it('resolveUserDisplayName falls back to OAuth name', () => {
    expect(resolveUserDisplayName({ fullName: null, name: 'Google Name' })).toBe(
      'Google Name'
    );
  });

  it('simulates PrismaAdapter user.create payload with name field', async () => {
    const oauthProfile = {
      name: 'Pedro Google',
      email: 'pedro@gmail.com',
      image: 'https://lh3.googleusercontent.com/a/example',
      emailVerified: new Date('2026-10-07T10:00:00.000Z'),
    };

    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 'user-new',
      ...oauthProfile,
      fullName: null,
      passwordHash: null,
      subscriptionTier: 'free',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const created = await prisma.user.create({
      data: oauthProfile,
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Pedro Google',
        email: 'pedro@gmail.com',
        image: oauthProfile.image,
        emailVerified: oauthProfile.emailVerified,
      }),
    });

    await syncOAuthUserFullName(prisma as never, created.id, created.name);
    expect(prisma.user.updateMany).toHaveBeenCalled();
  });
});
