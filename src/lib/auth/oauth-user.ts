import type { PrismaClient } from '@prisma/client';

/** After OAuth sign-up, mirror Auth.js `name` into app `fullName` when empty. */
export async function syncOAuthUserFullName(
  prisma: PrismaClient,
  userId: string,
  name: string | null | undefined
): Promise<void> {
  const trimmed = name?.trim();
  if (!trimmed) return;

  await prisma.user.updateMany({
    where: { id: userId, fullName: null },
    data: { fullName: trimmed },
  });
}
