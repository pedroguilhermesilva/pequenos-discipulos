import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';

export const ACTIVE_CHILD_COOKIE = 'active_child_profile_id';
export const DEV_USER_COOKIE = 'dev_user_id';

export async function getCurrentUserId(): Promise<string> {
  const jar = await cookies();
  return jar.get(DEV_USER_COOKIE)?.value ?? process.env.DEV_USER_ID ?? 'dev-user-1';
}

export async function getCurrentChildProfileId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(ACTIVE_CHILD_COOKIE)?.value ?? null;
}

export async function getCurrentUser() {
  const id = await getCurrentUserId();
  return prisma.user.findUnique({ where: { id } });
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    // Auto-create seed user in local mode if missing
    const id = await getCurrentUserId();
    return prisma.user.upsert({
      where: { id },
      update: {},
      create: {
        id,
        email: 'dev@pequenos-discipulos.local',
        fullName: 'Conta de desenvolvimento',
        subscriptionTier: 'free',
      },
    });
  }
  return user;
}
