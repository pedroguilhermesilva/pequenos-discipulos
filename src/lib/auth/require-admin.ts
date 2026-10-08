import { UnauthorizedError } from '@/lib/domain/errors';
import { requireCurrentUser } from '@/lib/auth/get-current-user';

function parseAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS?.trim() ?? '';
  if (!raw) return new Set();
  return new Set(
    raw
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return parseAdminEmails().has(email.trim().toLowerCase());
}

export async function requireAdmin() {
  const user = await requireCurrentUser();
  if (!isAdminEmail(user.email)) {
    throw new UnauthorizedError('Acesso restrito à equipe de moderação.');
  }
  return user;
}
