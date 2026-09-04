'use client';

import { useState } from 'react';
import { SubscriptionPlansModal } from '@/components/settings/SubscriptionPlansModal';
import { cn } from '@/lib/cn';
import type { SubscriptionTier } from '@/lib/user/usage-limits';

interface SidebarPremiumTeaserProps {
  onNavigate?: () => void;
  currentTier?: SubscriptionTier;
  collapsed?: boolean;
}

export function SidebarPremiumTeaser({
  onNavigate,
  currentTier = 'free',
  collapsed = false,
}: SidebarPremiumTeaserProps) {
  const [plansModalOpen, setPlansModalOpen] = useState(false);

  const handleOpenPlans = () => {
    onNavigate?.();
    setPlansModalOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpenPlans}
        title={collapsed ? 'Plano Premium' : undefined}
        aria-label={collapsed ? 'Plano Premium' : undefined}
        className={cn(
          'group flex w-full items-center rounded-livro text-left transition-colors hover:bg-pergaminho-escuro/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja',
          collapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2'
        )}
      >
        <span
          className="material-symbols-outlined shrink-0 text-lg text-vida"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          workspace_premium
        </span>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold leading-tight text-tinta">Plano Premium</p>
              <p className="truncate text-[10px] leading-snug text-oliva">Histórias ilimitadas</p>
            </div>
            <span className="material-symbols-outlined shrink-0 text-base text-oliva transition-colors group-hover:text-laranja">
              chevron_right
            </span>
          </>
        )}
      </button>

      <SubscriptionPlansModal
        open={plansModalOpen}
        onClose={() => setPlansModalOpen(false)}
        currentTier={currentTier}
      />
    </>
  );
}
