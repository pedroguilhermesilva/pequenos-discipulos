import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { clearOnboardingDraft } from '@/lib/profiles/storage';

interface HeaderProps {
  logoHref?: string;
}

export const Header: React.FC<HeaderProps> = ({ logoHref }) => {
  return (
    <header className="flex items-center justify-between border-b border-borda bg-pergaminho/80 backdrop-blur-sm px-6 md:px-10 py-3 sticky top-0 z-50">
      <Logo
        size="md"
        href={logoHref}
        onClick={logoHref ? () => clearOnboardingDraft() : undefined}
      />
      <div className="flex gap-2">
        <Link
          href="/configuracoes"
          aria-label="Configurações"
          className="flex items-center justify-center rounded-livro h-10 w-10 bg-pergaminho-escuro text-tinta transition-colors hover:bg-laranja/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja"
        >
          <span className="material-symbols-outlined">settings</span>
        </Link>
      </div>
    </header>
  );
};
