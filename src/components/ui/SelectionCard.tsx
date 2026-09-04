import React from 'react';
import { cn } from '@/lib/cn';

interface SelectionCardProps {
  selected: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  sublabel?: string;
  className?: string;
}

export const SelectionCard: React.FC<SelectionCardProps> = ({
  selected,
  onClick,
  icon,
  label,
  sublabel,
  className,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center p-6 border-2 rounded-livro transition-all group active:scale-95 text-center',
        selected
          ? 'border-laranja bg-laranja-suave shadow-livro'
          : 'border-borda hover:border-laranja/50 hover:bg-laranja-suave/50',
        className
      )}
    >
      <span
        className={cn(
          'material-symbols-outlined text-4xl mb-2 transition-colors',
          selected ? 'text-laranja' : 'text-oliva group-hover:text-laranja'
        )}
      >
        {icon}
      </span>
      <span className="font-bold text-tinta leading-tight">
        {label}
        {sublabel && (
          <>
            <br />
            <span className="text-xs font-medium text-oliva">{sublabel}</span>
          </>
        )}
      </span>
    </button>
  );
};
