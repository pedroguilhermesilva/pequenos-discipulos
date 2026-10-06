import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { UnauthorizedError } from '@/lib/domain/errors';

export const ACTIVE_CHILD_COOKIE = 'active_child_profile_id';

export async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function getCurrentUserId(): Promise<string> {
  const id = await getSessionUserId();
  if (!id) {
    throw new UnauthorizedError('Sessão não encontrada. Faça login para continuar.');
  }
  return id;
}

export async function getCurrentChildProfileId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(ACTIVE_CHILD_COOKIE)?.value ?? null;
}

export async function getCurrentUser() {
  const id = await getSessionUserId();
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

export async function requireCurrentUser() {
  const id = await getCurrentUserId();
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new UnauthorizedError('Conta não encontrada.');
  }
  return user;
}
