'use client';

import { ageTiers, type AgeTier } from '@/lib/stories/age-tiers';
import { cn } from '@/lib/cn';

interface AgeTierSelectorProps {
  value: AgeTier;
  onChange: (tier: AgeTier) => void;
  className?: string;
}

export function AgeTierSelector({ value, onChange, className }: AgeTierSelectorProps) {
  return (
    <div className={className}>
      <label className="text-xs font-bold uppercase tracking-wider text-oliva block mb-2">
        Nível de linguagem por idade
      </label>
      <div
        className="grid grid-cols-3 gap-2 bg-pergaminho-escuro p-1.5 rounded-livro-xl"
        role="radiogroup"
        aria-label="Nível de linguagem por idade"
      >
        {ageTiers.map((tier) => {
          const isActive = value === tier.id;
          return (
            <button
              key={tier.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(tier.id)}
              className={cn(
                'py-2 px-2 md:px-3 rounded-xl text-xs font-bold transition text-left',
                isActive
                  ? 'bg-white text-vida shadow-sm'
                  : 'text-oliva hover:text-tinta'
              )}
            >
              {tier.emoji} {tier.label}
              <span
                className={cn(
                  'hidden md:block font-normal text-[10px] mt-0.5',
                  isActive ? 'text-vida/70' : 'text-oliva/70'
                )}
              >
                {tier.subtitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
