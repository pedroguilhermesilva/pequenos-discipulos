import React from 'react';
import { cn } from '@/lib/cn';

interface MobileMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  expanded?: boolean;
}

export function MobileMenuButton({
  expanded = false,
  className,
  ...props
}: MobileMenuButtonProps) {
  return (
    <button
      type="button"
      aria-label="Abrir menu de navegação"
      aria-expanded={expanded}
      aria-controls="app-sidebar"
      className={cn(
        'group lg:hidden inline-flex items-center gap-2.5 mb-4',
        'min-h-11 px-3.5 py-2',
        'bg-white border border-borda rounded-livro shadow-livro',
        'text-tinta font-bold text-sm',
        'hover:bg-pergaminho-escuro hover:shadow-livro-lg',
        'active:scale-[0.98] transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja focus-visible:ring-offset-2',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          'flex items-center justify-center size-8 rounded-lg transition-colors duration-200',
          'bg-laranja-suave text-laranja',
          'group-hover:bg-laranja group-hover:text-white'
        )}
      >
        <span className="material-symbols-outlined text-[20px] leading-none">menu</span>
      </span>
      Menu
    </button>
  );
}
