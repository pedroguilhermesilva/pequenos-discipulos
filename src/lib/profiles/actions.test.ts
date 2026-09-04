import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listChildProfilesAction, setActiveChildProfile } from '@/lib/profiles/actions';

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
});
