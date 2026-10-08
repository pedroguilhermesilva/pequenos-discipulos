import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import { DEFAULT_PREFERENCES } from '@/lib/onboarding/defaults';
import {
  deleteChildProfileAction,
  getActiveChildProfileIdAction,
  listChildProfilesAction,
  setActiveChildProfile,
} from '@/lib/profiles/actions';

const DEV_USER_ID = process.env.DEV_USER_ID ?? 'dev-user-1';

const cookieStore = new Map<string, string>();

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => {
      const value = cookieStore.get(name);
      return value ? { name, value } : undefined;
    },
    set: (name: string, value: string) => {
      cookieStore.set(name, value);
    },
    delete: (name: string) => {
      cookieStore.delete(name);
    },
  })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('profiles/actions', () => {
  beforeEach(() => {
    cookieStore.clear();
  });

  it('lists seeded child profiles for the dev user', async () => {
    const result = await listChildProfilesAction();
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data.some((profile) => profile.id === 'dev-child-1')).toBe(true);
  });

  it('sets the active child profile cookie', async () => {
    const result = await setActiveChildProfile('dev-child-1');
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.profileId).toBe('dev-child-1');
    expect(cookieStore.get('active_child_profile_id')).toBe('dev-child-1');
  });

  it('rejects unknown child profile ids', async () => {
    const result = await setActiveChildProfile('missing-profile');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('NOT_FOUND');
  });

  it('reads the active child profile id from the cookie', async () => {
    cookieStore.set('active_child_profile_id', 'dev-child-1');
    const result = await getActiveChildProfileIdAction();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.profileId).toBe('dev-child-1');
  });

  it('deletes a child profile and switches the active cookie when needed', async () => {
    await prisma.user.update({
      where: { id: DEV_USER_ID },
      data: { subscriptionTier: 'premium' },
    });

    const extraProfile = await prisma.childProfile.create({
      data: {
        id: 'test-child-delete',
        userId: DEV_USER_ID,
        name: 'Teste Excluir',
        avatarColor: 'ceu',
        preferences: { ...DEFAULT_PREFERENCES, childName: 'Teste Excluir', ageGroup: '9-11' },
      },
    });

    cookieStore.set('active_child_profile_id', extraProfile.id);

    const result = await deleteChildProfileAction(extraProfile.id);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.deletedId).toBe(extraProfile.id);
    expect(result.data.activeProfileId).toBe('dev-child-1');
    expect(cookieStore.get('active_child_profile_id')).toBe('dev-child-1');

    const deleted = await prisma.childProfile.findUnique({ where: { id: extraProfile.id } });
    expect(deleted).toBeNull();

    await prisma.user.update({
      where: { id: DEV_USER_ID },
      data: { subscriptionTier: 'free' },
    });
  });
});
