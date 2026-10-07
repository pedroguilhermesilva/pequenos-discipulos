/** Preferred display name: app field first, then Auth.js OAuth `name`. */
export function resolveUserDisplayName(user: {
  fullName?: string | null;
  name?: string | null;
}): string | null {
  const fullName = user.fullName?.trim();
  if (fullName) return fullName;

  const name = user.name?.trim();
  return name || null;
}
