'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useChildProfiles } from '@/components/profiles/ChildProfileProvider';

const EXEMPT_PATHS = ['/perfis', '/onboarding', '/ajuda'];

export function AppProfileGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { profiles, activeProfile, isReady } = useChildProfiles();

  const isExempt = EXEMPT_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  useEffect(() => {
    if (!isReady || isExempt) return;

    if (profiles.length === 0) {
      router.replace('/onboarding/step-1');
      return;
    }

    if (!activeProfile) {
      router.replace('/perfis');
    }
  }, [isReady, isExempt, profiles.length, activeProfile, router]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-pergaminho textura-pergaminho flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-oliva">
          <span className="material-symbols-outlined text-3xl animate-pulse text-vida">
            auto_stories
          </span>
          <p className="text-sm font-semibold">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!isExempt && profiles.length > 0 && !activeProfile) {
    return null;
  }

  return <>{children}</>;
}
