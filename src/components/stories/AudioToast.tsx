'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/cn';

interface AudioToastProps {
  title: string;
  description: string;
  visible: boolean;
  variant?: 'success' | 'error';
  onHide: () => void;
}

export function AudioToast({
  title,
  description,
  visible,
  variant = 'success',
  onHide,
}: AudioToastProps) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onHide, variant === 'error' ? 5000 : 3000);
    return () => clearTimeout(timer);
  }, [visible, onHide, title, variant]);

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 bg-painel-escuro text-white px-4 py-3 rounded-livro-xl shadow-xl flex items-center gap-3 border transition-all duration-300 z-40 max-w-sm',
        variant === 'error' ? 'border-laranja/40' : 'border-borda-escura/50',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          'p-2 rounded-xl shrink-0',
          variant === 'error' ? 'bg-laranja text-white' : 'bg-dourado text-tinta'
        )}
      >
        <span className="material-symbols-outlined text-base">
          {variant === 'error' ? 'error' : 'volume_up'}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold">{title}</p>
        <p className="text-[10px] text-oliva/80 line-clamp-3">{description}</p>
      </div>
    </div>
  );
}
