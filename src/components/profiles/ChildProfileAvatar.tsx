import { cn } from '@/lib/cn';
import { getAvatarColor, getProfileInitials } from '@/lib/profiles/constants';
import type { ChildProfile } from '@/lib/profiles/types';

interface ChildProfileAvatarProps {
  profile: Pick<ChildProfile, 'name' | 'avatarColor'>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  active?: boolean;
}

const sizeClasses = {
  sm: 'w-10 h-10 text-sm',
  md: 'w-14 h-14 text-lg',
  lg: 'w-20 h-20 text-2xl',
  xl: 'w-28 h-28 text-3xl md:w-32 md:h-32 md:text-4xl',
};

export function ChildProfileAvatar({
  profile,
  size = 'md',
  className,
  active,
}: ChildProfileAvatarProps) {
  const color = getAvatarColor(profile.avatarColor);
  const initials = getProfileInitials(profile.name);

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-display font-bold shrink-0 transition-all',
        color.bg,
        color.text,
        sizeClasses[size],
        active && `ring-4 ${color.ring}`,
        className
      )}
      aria-hidden
    >
      {initials}
    </div>
  );
}
