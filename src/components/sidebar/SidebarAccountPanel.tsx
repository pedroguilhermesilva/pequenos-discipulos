'use client';

import { ActiveProfileSwitcher } from '@/components/profiles/ActiveProfileSwitcher';
import { cn } from '@/lib/cn';

interface SidebarAccountPanelProps {
  onSignOut: () => void;
  isSigningOut: boolean;
  onNavigate?: () => void;
  collapsed?: boolean;
}

export function SidebarAccountPanel({
  onSignOut,
  isSigningOut,
  onNavigate,
  collapsed = false,
}: SidebarAccountPanelProps) {
  return (
    <div
      className={cn(
        'rounded-livro border border-borda bg-pergaminho/40 overflow-hidden',
        collapsed && 'border-0 bg-transparent'
      )}
    >
      <ActiveProfileSwitcher
        variant="embedded"
        collapsed={collapsed}
        onNavigate={onNavigate}
      />
      <div className={cn('border-t border-borda/70', collapsed && 'border-0')}>
        <button
          type="button"
          onClick={onSignOut}
          disabled={isSigningOut}
          title={collapsed ? 'Sair' : undefined}
          aria-label={collapsed ? 'Sair' : undefined}
          className={cn(
            'flex items-center w-full text-xs font-semibold',
            'text-oliva hover:text-tinta hover:bg-pergaminho-escuro/80 transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja focus-visible:ring-inset',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            collapsed ? 'justify-center p-2' : 'gap-2.5 px-4 py-2.5'
          )}
        >
          <span className="material-symbols-outlined text-base">logout</span>
          {!collapsed && (isSigningOut ? 'A sair…' : 'Sair')}
        </button>
      </div>
    </div>
  );
}
