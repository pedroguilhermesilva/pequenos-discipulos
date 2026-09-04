import React from 'react';
import { cn } from '@/lib/cn';

interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  children,
  fullWidth = false,
  className,
  ...props
}) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 px-6 py-3.5',
        'border-2 border-laranja text-laranja font-bold text-base rounded-livro',
        'hover:bg-laranja-suave transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja focus-visible:ring-offset-2',
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
