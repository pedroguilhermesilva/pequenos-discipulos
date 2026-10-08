import { UnauthorizedError } from '@/lib/domain/errors';
import { requireCurrentUser } from '@/lib/auth/get-current-user';

export function isAdminUser(user: { isAdmin: boolean }): boolean {
  return user.isAdmin;
}

export async function requireAdmin() {
  const user = await requireCurrentUser();
  if (!isAdminUser(user)) {
    throw new UnauthorizedError('Acesso restrito à equipe de moderação.');
  }
  return user;
}
