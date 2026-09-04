'use client';

import Link from 'next/link';
import { useChildProfiles } from '@/components/profiles/ChildProfileProvider';
import { cn } from '@/lib/cn';
import { getNewStoryEntryHref } from '@/lib/stories/new-story';

type NewStoryCTAVariant = 'primary' | 'secondary' | 'compact';

interface NewStoryCTAProps {
  variant?: NewStoryCTAVariant;
  className?: string;
  label?: string;
  iconOnly?: boolean;
  onNavigate?: () => void;
}

const variantStyles: Record<NewStoryCTAVariant, string> = {
  primary:
    'inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber to-laranja text-white font-bold rounded-livro shadow-livro hover:from-amber/90 hover:to-laranja/90 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja focus-visible:ring-offset-2',
  secondary:
    'inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border-2 border-laranja text-laranja font-bold text-sm rounded-livro hover:bg-laranja-suave transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja',
  compact:
    'inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber to-laranja text-white font-bold text-xs rounded-lg hover:from-amber/90 hover:to-laranja/90 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja',
};

export function NewStoryCTA({
  variant = 'primary',
  className,
  label = 'Criar nova história',
  iconOnly = false,
  onNavigate,
}: NewStoryCTAProps) {
  const { activeProfile } = useChildProfiles();
  const href = getNewStoryEntryHref(activeProfile?.hasCreatedStory);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={iconOnly ? label : undefined}
      aria-label={iconOnly ? label : undefined}
      className={cn(
        variantStyles[variant],
        iconOnly && 'aspect-square p-0 size-10 shrink-0',
        className
      )}
    >
      <span
        className="material-symbols-outlined text-base"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        auto_awesome
      </span>
      {!iconOnly && label}
    </Link>
  );
}
