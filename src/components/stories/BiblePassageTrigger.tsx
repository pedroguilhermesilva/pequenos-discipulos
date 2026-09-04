'use client';

import { cn } from '@/lib/cn';

interface BiblePassageTriggerProps {
  passageReference: string;
  excerpt: string;
  onClick: () => void;
  className?: string;
}

export function BiblePassageTrigger({
  passageReference,
  excerpt,
  onClick,
  className,
}: BiblePassageTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group w-full rounded-livro-xl border border-borda bg-white p-4 text-left shadow-sm',
        'transition-colors hover:bg-pergaminho-escuro/30',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja',
        className
      )}
      aria-label={`Ver passagem bíblica: ${passageReference}`}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-livro bg-pergaminho-escuro p-2 text-oliva">
          <span className="material-symbols-outlined text-lg">history_edu</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-bold text-tinta">Passagem bíblica</p>
          <p className="mt-0.5 text-xs font-bold italic text-laranja">{passageReference}</p>
        </div>
      </div>

      <p className="mt-3 line-clamp-3 font-story text-sm italic leading-relaxed text-oliva">
        &ldquo;{excerpt}&rdquo;
      </p>

      <p className="mt-3 flex items-center justify-end gap-1 text-xs font-semibold text-vida transition-colors group-hover:text-vida-dark">
        Ver passagem completa
        <span className="material-symbols-outlined text-sm" aria-hidden="true">
          chevron_right
        </span>
      </p>
    </button>
  );
}
