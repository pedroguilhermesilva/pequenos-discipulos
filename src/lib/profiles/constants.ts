import type { ProfileAvatarColorId } from './types';

export const MAX_CHILD_PROFILES = 5;

export const PROFILE_AVATAR_COLORS: Array<{
  id: ProfileAvatarColorId;
  bg: string;
  text: string;
  ring: string;
  hover: string;
}> = [
  { id: 'laranja', bg: 'bg-laranja', text: 'text-white', ring: 'ring-laranja/40', hover: 'hover:ring-laranja/60' },
  { id: 'vida', bg: 'bg-vida', text: 'text-white', ring: 'ring-vida/40', hover: 'hover:ring-vida/60' },
  { id: 'dourado', bg: 'bg-dourado', text: 'text-tinta', ring: 'ring-dourado/40', hover: 'hover:ring-dourado/60' },
  { id: 'ceu', bg: 'bg-ceu', text: 'text-white', ring: 'ring-ceu/40', hover: 'hover:ring-ceu/60' },
  { id: 'amber', bg: 'bg-amber', text: 'text-tinta', ring: 'ring-amber/40', hover: 'hover:ring-amber/60' },
];

export function getAvatarColor(id: ProfileAvatarColorId) {
  return PROFILE_AVATAR_COLORS.find((c) => c.id === id) ?? PROFILE_AVATAR_COLORS[0];
}

export function pickAvatarColor(index: number): ProfileAvatarColorId {
  return PROFILE_AVATAR_COLORS[index % PROFILE_AVATAR_COLORS.length].id;
}

export function getProfileInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
}
