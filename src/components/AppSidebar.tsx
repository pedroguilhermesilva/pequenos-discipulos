'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { NewStoryCTA } from '@/components/NewStoryCTA';
import { SidebarAccountPanel } from '@/components/sidebar/SidebarAccountPanel';
import { SidebarPremiumTeaser } from '@/components/sidebar/SidebarPremiumTeaser';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/cn';
import { appNavItems, getActiveNavId } from '@/lib/app-nav';
import { clearLocalSession } from '@/lib/profiles/storage';

interface AppSidebarProps {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

export function AppSidebar({ open, collapsed, onClose, onToggleCollapse }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const activeId = getActiveNavId(pathname);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    onClose();

    try {
      clearLocalSession();
      router.push('/login');
    } finally {
      setIsSigningOut(false);
    }
  };

  const collapseButton = (
    <button
      type="button"
      onClick={onToggleCollapse}
      className={cn(
        'hidden lg:flex items-center justify-center size-8 rounded-livro text-oliva hover:text-tinta hover:bg-pergaminho-escuro transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja',
        !collapsed && 'absolute z-10 top-6 right-4'
      )}
      aria-label={collapsed ? 'Expandir menu' : 'Minimizar menu'}
    >
      <span className="material-symbols-outlined text-xl">
        {collapsed ? 'chevron_right' : 'chevron_left'}
      </span>
    </button>
  );

  return (
    <>
      {open && (
        <button
          className="fixed inset-0 bg-tinta/40 z-40 lg:hidden"
          onClick={onClose}
          aria-label="Fechar menu"
        />
      )}

      <aside
        id="app-sidebar"
        className={cn(
          'fixed lg:relative inset-y-0 left-0 z-50 bg-white border-r border-borda flex flex-col justify-between transition-all duration-300',
          collapsed ? 'w-[4.5rem] p-3' : 'w-72 p-6',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {!collapsed && collapseButton}

        <div className={cn('flex flex-col', collapsed ? 'gap-4 items-center' : 'gap-8')}>
          {collapsed && collapseButton}

          {!collapsed ? (
            <Link
              href="/home"
              onClick={onClose}
              className="block pr-9 focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja rounded-livro"
            >
              <div className="flex items-center gap-2">
                <Logo size="sm" showText={false} className="shrink-0" />
                <span className="text-base font-display font-bold text-tinta leading-tight tracking-tight whitespace-nowrap">
                  Pequenos Discípulos
                </span>
              </div>
              <p className="text-oliva text-sm ml-9 mt-0.5 font-display">Educação bíblica infantil</p>
            </Link>
          ) : (
            <Link
              href="/home"
              onClick={onClose}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja rounded-livro"
            >
              <Logo size="sm" showText={false} />
            </Link>
          )}

          <nav
            className={cn('flex flex-col gap-1', collapsed && 'w-full items-center')}
            aria-label="Navegação principal"
          >
            {appNavItems.map((item) => {
              const isActive = item.id === activeId;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onClose}
                  title={collapsed ? item.label : undefined}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center rounded-livro transition-colors text-sm font-semibold',
                    collapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-3',
                    isActive
                      ? 'bg-laranja-suave text-laranja'
                      : 'text-tinta hover:bg-pergaminho-escuro'
                  )}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  {!collapsed && item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className={cn('flex flex-col gap-3', collapsed && 'items-center')}>
          <NewStoryCTA
            variant="primary"
            iconOnly={collapsed}
            className={cn(!collapsed && 'w-full py-3 text-sm')}
            onNavigate={onClose}
          />
          <SidebarPremiumTeaser collapsed={collapsed} onNavigate={onClose} />
          <SidebarAccountPanel
            collapsed={collapsed}
            onSignOut={handleSignOut}
            isSigningOut={isSigningOut}
            onNavigate={onClose}
          />
        </div>
      </aside>
    </>
  );
}
