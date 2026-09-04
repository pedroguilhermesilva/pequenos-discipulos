'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { subscriptionPlans } from '@/lib/user/subscription-plans';
import type { SubscriptionTier } from '@/lib/user/usage-limits';
import { cn } from '@/lib/cn';

interface SubscriptionPlansModalProps {
  open: boolean;
  onClose: () => void;
  currentTier: SubscriptionTier;
}

export function SubscriptionPlansModal({
  open,
  onClose,
  currentTier,
}: SubscriptionPlansModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscription-plans-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-tinta/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fechar planos"
      />

      <div
        className="relative z-10 bg-white rounded-livro-xl max-w-3xl w-full max-h-[min(90dvh,820px)] overflow-y-auto shadow-2xl border border-borda animate-fade-in"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 px-6 py-5 border-b border-borda bg-pergaminho/90 backdrop-blur-sm flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-oliva mb-1">
              O seu plano
            </p>
            <h2 id="subscription-plans-title" className="font-display font-bold text-2xl text-tinta">
              Planos Pequenos Discípulos
            </h2>
            <p className="text-sm text-oliva mt-1">
              Compare opções e escolha o melhor para a sua família.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-oliva hover:text-tinta transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-vida rounded p-1"
            aria-label="Fechar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {subscriptionPlans.map((plan) => {
            const isCurrent = plan.id === currentTier;
            const isUpgrade = !isCurrent && getTierRank(plan.id) > getTierRank(currentTier);

            return (
              <div
                key={plan.id}
                className={cn(
                  'rounded-livro border p-5 md:p-6 transition-colors',
                  isCurrent
                    ? 'border-laranja/40 bg-laranja/5 shadow-livro'
                    : 'border-borda bg-white'
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-bold text-xl text-tinta">{plan.name}</h3>
                      {isCurrent && (
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 bg-laranja/15 text-laranja rounded-full">
                          Plano atual
                        </span>
                      )}
                      {plan.badge && !isCurrent && (
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 bg-vida/10 text-vida rounded-full">
                          {plan.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-oliva">{plan.tagline}</p>
                  </div>
                  <div className="sm:text-right shrink-0">
                    <p className="font-display font-bold text-2xl text-tinta">
                      {plan.price}
                      <span className="text-sm font-semibold text-oliva">{plan.period}</span>
                    </p>
                  </div>
                </div>

                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-tinta">
                      <span className="material-symbols-outlined text-vida text-base shrink-0 mt-0.5">
                        check_circle
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-pergaminho/60 rounded-livro text-xs">
                  <div>
                    <p className="text-oliva">Texto</p>
                    <p className="font-semibold text-tinta">{plan.limits.text}</p>
                  </div>
                  <div>
                    <p className="text-oliva">Áudio</p>
                    <p className="font-semibold text-tinta">{plan.limits.audio}</p>
                  </div>
                  <div>
                    <p className="text-oliva">Vídeo</p>
                    <p className="font-semibold text-tinta">{plan.limits.video}</p>
                  </div>
                  <div>
                    <p className="text-oliva">Perfis</p>
                    <p className="font-semibold text-tinta">{plan.profiles}</p>
                  </div>
                </div>

                {!isCurrent && (
                  <button
                    type="button"
                    disabled
                    className={cn(
                      'mt-4 w-full sm:w-auto px-5 py-2.5 rounded-livro font-bold text-sm transition-all',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja',
                      isUpgrade
                        ? 'bg-gradient-to-r from-amber to-laranja text-white opacity-70 cursor-not-allowed'
                        : 'border border-borda text-oliva cursor-not-allowed'
                    )}
                  >
                    {isUpgrade ? 'Upgrade em breve' : 'Alterar plano em breve'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-6 pb-6">
          <p className="text-xs text-oliva/80 text-center">
            Pagamentos e mudança de plano estarão disponíveis em breve. Por agora, continue a
            explorar com o seu plano atual.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

function getTierRank(tier: SubscriptionTier): number {
  switch (tier) {
    case 'free':
      return 0;
    case 'premium':
      return 1;
    case 'family':
      return 2;
    default:
      return 0;
  }
}
