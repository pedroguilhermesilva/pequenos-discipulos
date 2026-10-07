import React from 'react';
import { cn } from '@/lib/cn';

interface SelectionCardProps {
  selected: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  sublabel?: string;
  className?: string;
  disabled?: boolean;
}

export const SelectionCard: React.FC<SelectionCardProps> = ({
  selected,
  onClick,
  icon,
  label,
  sublabel,
  className,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      className={cn(
        'flex flex-col items-center justify-center p-6 border-2 rounded-livro transition-all text-center',
        disabled
          ? 'border-borda bg-pergaminho/70 cursor-not-allowed opacity-60'
          : 'group active:scale-95',
        !disabled && selected
          ? 'border-laranja bg-laranja-suave shadow-livro'
          : !disabled && 'border-borda hover:border-laranja/50 hover:bg-laranja-suave/50',
        className
      )}
    >
      <span
        className={cn(
          'material-symbols-outlined text-4xl mb-2 transition-colors',
          disabled
            ? 'text-oliva'
            : selected
              ? 'text-laranja'
              : 'text-oliva group-hover:text-laranja'
        )}
      >
        {icon}
      </span>
      <span className={cn('font-bold leading-tight', disabled ? 'text-oliva' : 'text-tinta')}>
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
