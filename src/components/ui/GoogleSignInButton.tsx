'use client';

import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { GoogleLogoIcon } from '@/components/ui/GoogleLogoIcon';

export interface GoogleSignInButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
  /** Defaults to "Continuar com Google" per Google Identity guidelines (pt-BR). */
  label?: string;
}

/**
 * Sign in with Google — light theme per Google Identity branding guidelines.
 * @see https://developers.google.com/identity/branding-guidelines
 */
export function GoogleSignInButton({
  fullWidth = false,
  label = 'Continuar com Google',
  className,
  disabled,
  type = 'button',
  ...props
}: GoogleSignInButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-3',
        'h-12 min-h-[40px] px-4',
        'rounded-livro border border-[#747775] bg-white',
        'font-sans text-base font-medium text-[#1F1F1F]',
        'transition-colors duration-150',
        'hover:bg-[#F8F9FA] active:bg-[#EEEEEE]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:border-[#747775]/60 disabled:bg-white disabled:text-[#1F1F1F]/38',
        'disabled:hover:bg-white disabled:active:bg-white',
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      <GoogleLogoIcon className="size-5" />
      <span className="leading-none">{label}</span>
    </button>
  );
}
