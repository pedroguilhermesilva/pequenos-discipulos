import React from 'react';
import { cn } from '@/lib/cn';

const themeColors: Record<string, string> = {
  animals: 'border-oliva bg-oliva/10 text-oliva',
  stars: 'border-dourado bg-dourado/10 text-dourado',
  heroes: 'border-ceu bg-ceu/10 text-ceu',
  nature: 'border-dourado/70 bg-dourado/5 text-tinta',
  music: 'border-dourado/70 bg-dourado/5 text-tinta',
  adventure: 'border-ceu/70 bg-ceu/5 text-tinta',
};

interface ChipToggleProps {
  selected: boolean;
  onClick: () => void;
  label: string;
  icon?: string;
  themeId?: string;
}

export const ChipToggle: React.FC<ChipToggleProps> = ({
  selected,
  onClick,
  label,
  icon,
  themeId,
}) => {
  const selectedThemeClass = themeId && selected ? themeColors[themeId] : '';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-5 py-2.5 rounded-full border font-medium flex items-center gap-2 transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja focus-visible:ring-offset-2',
        selected
          ? selectedThemeClass || 'border-laranja bg-laranja text-white'
          : 'border-borda bg-white text-tinta hover:border-laranja/50'
      )}
    >
      {icon && <span className="material-symbols-outlined text-sm">{icon}</span>}
      {label}
    </button>
  );
};
