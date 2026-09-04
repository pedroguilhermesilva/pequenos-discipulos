'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProfilePicker } from '@/components/profiles/ProfilePicker';
import { ChildProfileProvider, useChildProfiles } from '@/components/profiles/ChildProfileProvider';

function PerfisContent() {
  const router = useRouter();
  const { profiles, isReady } = useChildProfiles();

  useEffect(() => {
    if (isReady && profiles.length === 0) {
      router.replace('/onboarding/step-1');
    }
  }, [isReady, profiles.length, router]);

  if (!isReady || profiles.length === 0) {
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

  return <ProfilePicker />;
}

export default function PerfisPage() {
  return (
    <ChildProfileProvider>
      <PerfisContent />
    </ChildProfileProvider>
  );
}
