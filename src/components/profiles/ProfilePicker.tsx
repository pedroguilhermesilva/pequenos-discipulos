'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ParentGateModal } from '@/components/stories/ParentGateModal';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/cn';
import { getAgeGroupLabel } from '@/lib/onboarding/constants';
import { MAX_CHILD_PROFILES } from '@/lib/profiles/constants';
import { ChildProfileAvatar } from '@/components/profiles/ChildProfileAvatar';
import { useChildProfiles } from '@/components/profiles/ChildProfileProvider';

interface ProfilePickerProps {
  redirectTo?: string;
  showManageHint?: boolean;
}

export function ProfilePicker({ redirectTo = '/home', showManageHint = true }: ProfilePickerProps) {
  const router = useRouter();
  const { profiles, activeProfile, selectProfile } = useChildProfiles();
  const [parentGateOpen, setParentGateOpen] = useState(false);
  const canAddProfile = profiles.length < MAX_CHILD_PROFILES;
  const canDismiss = Boolean(activeProfile);

  const handleSelect = (profileId: string) => {
    selectProfile(profileId);
    router.push(redirectTo);
  };

  const handleDismiss = () => {
    router.push(redirectTo);
  };

  const handleAddProfile = () => {
    setParentGateOpen(true);
  };

  const handleParentGateSuccess = () => {
    router.push('/onboarding/step-1?modo=novo');
  };

  return (
    <div className="min-h-screen bg-pergaminho textura-pergaminho flex flex-col">
      <header className="relative p-6 md:p-10 flex justify-center items-center">
        <Logo size="md" />
        {canDismiss && (
          <button
            type="button"
            onClick={handleDismiss}
            className={cn(
              'absolute right-6 md:right-10 top-1/2 -translate-y-1/2',
              'flex items-center justify-center w-10 h-10 rounded-livro',
              'bg-white border border-borda text-oliva hover:text-tinta hover:bg-pergaminho-escuro',
              'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja'
            )}
            aria-label="Fechar e continuar com o perfil atual"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
        <div className="text-center mb-10 md:mb-14 animate-fade-in">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-tinta mb-3">
            Quem vai ler hoje?
          </h1>
          <p className="text-oliva text-base md:text-lg max-w-md mx-auto">
            Cada filho tem histórias e preferências adaptadas à idade dele.
          </p>
        </div>

        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 md:gap-8 max-w-3xl w-full"
          role="list"
          aria-label="Perfis de crianças"
        >
          {profiles.map((profile) => (
            <button
              key={profile.id}
              type="button"
              role="listitem"
              onClick={() => handleSelect(profile.id)}
              className="group flex flex-col items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja rounded-livro p-2"
            >
              <div className="relative">
                <ChildProfileAvatar
                  profile={profile}
                  size="xl"
                  className="group-hover:scale-105 group-hover:shadow-livro-lg transition-all duration-300"
                />
                <span className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-borda rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                  <span className="material-symbols-outlined text-vida text-base">play_arrow</span>
                </span>
              </div>
              <div className="text-center">
                <p className="font-display font-bold text-tinta text-base md:text-lg group-hover:text-laranja transition-colors">
                  {profile.name}
                </p>
                <p className="text-xs text-oliva mt-0.5">
                  {getAgeGroupLabel(profile.preferences.ageGroup)}
                </p>
              </div>
            </button>
          ))}

          {canAddProfile && (
            <button
              type="button"
              onClick={handleAddProfile}
              className="group flex flex-col items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja rounded-livro p-2"
            >
              <div
                className={cn(
                  'w-28 h-28 md:w-32 md:h-32 rounded-full border-2 border-dashed border-borda',
                  'bg-white/60 flex items-center justify-center',
                  'group-hover:border-laranja group-hover:bg-laranja/5 transition-all duration-300'
                )}
              >
                <span className="material-symbols-outlined text-4xl text-oliva group-hover:text-laranja transition-colors">
                  add
                </span>
              </div>
              <p className="font-display font-bold text-oliva text-base group-hover:text-laranja transition-colors">
                Adicionar filho
              </p>
            </button>
          )}
        </div>

        {canDismiss && (
          <button
            type="button"
            onClick={handleDismiss}
            className="mt-8 text-sm font-semibold text-oliva hover:text-laranja transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja rounded"
          >
            Continuar como {activeProfile?.name}
          </button>
        )}

        {showManageHint && (
          <p className="mt-12 text-xs text-oliva/70 text-center max-w-sm">
            Para editar ou remover perfis, acesse{' '}
            <span className="font-semibold text-oliva">Configurações</span> após entrar.
          </p>
        )}
      </main>

      <ParentGateModal
        open={parentGateOpen}
        onClose={() => setParentGateOpen(false)}
        onSuccess={handleParentGateSuccess}
      />
    </div>
  );
}
