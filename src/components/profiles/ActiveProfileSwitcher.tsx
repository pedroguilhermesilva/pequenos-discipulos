'use client';

import Link from 'next/link';
import { ChildProfileAvatar } from '@/components/profiles/ChildProfileAvatar';
import { useChildProfiles } from '@/components/profiles/ChildProfileProvider';
import { cn } from '@/lib/cn';
import { getAgeGroupLabel } from '@/lib/onboarding/constants';

type ActiveProfileSwitcherVariant = 'default' | 'embedded';

interface ActiveProfileSwitcherProps {
  variant?: ActiveProfileSwitcherVariant;
  collapsed?: boolean;
  onNavigate?: () => void;
}

const variantStyles: Record<ActiveProfileSwitcherVariant, string> = {
  default:
    'rounded-livro border border-borda bg-pergaminho/50 hover:bg-pergaminho-escuro hover:border-vida/30',
  embedded: 'rounded-none border-0 bg-transparent hover:bg-pergaminho-escuro/70',
};

export function ActiveProfileSwitcher({
  variant = 'default',
  collapsed = false,
  onNavigate,
}: ActiveProfileSwitcherProps) {
  const { activeProfile } = useChildProfiles();

  if (!activeProfile) return null;

  return (
    <Link
      href="/perfis"
      onClick={onNavigate}
      title={collapsed ? `Perfil: ${activeProfile.name}` : undefined}
      aria-label={collapsed ? `Perfil: ${activeProfile.name}` : undefined}
      className={cn(
        'flex items-center transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja focus-visible:ring-inset',
        collapsed ? 'justify-center p-2' : 'gap-3 p-3',
        variantStyles[variant]
      )}
    >
      <ChildProfileAvatar profile={activeProfile} size="sm" />
      {!collapsed && (
        <>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-tinta truncate group-hover:text-laranja transition-colors">
              {activeProfile.name}
            </p>
            <p className="text-[10px] text-oliva truncate">
              {getAgeGroupLabel(activeProfile.preferences.ageGroup)}
            </p>
          </div>
          <span className="material-symbols-outlined text-oliva text-lg group-hover:text-laranja transition-colors">
            swap_horiz
          </span>
        </>
      )}
    </Link>
  );
}
