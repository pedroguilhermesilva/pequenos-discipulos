'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ParentGateModal } from '@/components/stories/ParentGateModal';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/cn';
import { getAgeGroupLabel } from '@/lib/onboarding/constants';
import { MAX_CHILD_PROFILES } from '@/lib/profiles/constants';
import {
  getProfileSwitchStatusLabel,
  PROFILE_SWITCH_ERROR,
} from '@/lib/profiles/profile-picker-messages';
import { ChildProfileAvatar } from '@/components/profiles/ChildProfileAvatar';
import { useChildProfiles } from '@/components/profiles/ChildProfileProvider';
import { notify } from '@/lib/notify';

interface ProfilePickerProps {
  redirectTo?: string;
  showManageHint?: boolean;
}

function ProfileSelectSpinner() {
  return (
    <div
      className="w-10 h-10 md:w-11 md:h-11 rounded-full border-[3px] border-white/50 border-t-laranja animate-spin shadow-sm"
      aria-hidden="true"
    />
  );
}

export function ProfilePicker({ redirectTo = '/home', showManageHint = true }: ProfilePickerProps) {
  const router = useRouter();
  const { profiles, activeProfile, selectProfile } = useChildProfiles();
  const [parentGateOpen, setParentGateOpen] = useState(false);
  const [selectingProfileId, setSelectingProfileId] = useState<string | null>(null);
  const canAddProfile = profiles.length < MAX_CHILD_PROFILES;
  const canDismiss = Boolean(activeProfile);
  const isSwitching = selectingProfileId !== null;

  const handleSelect = async (profileId: string) => {
    if (isSwitching) return;

    setSelectingProfileId(profileId);

    try {
      const selected = await selectProfile(profileId);
      if (!selected) {
        notify.error(PROFILE_SWITCH_ERROR);
        setSelectingProfileId(null);
        return;
      }

      notify.success(`Perfil de ${selected.name} selecionado.`);
      router.push(redirectTo);
    } catch {
      notify.error(PROFILE_SWITCH_ERROR);
      setSelectingProfileId(null);
    }
  };

  const handleDismiss = () => {
    if (isSwitching) return;
    router.push(redirectTo);
  };

  const handleAddProfile = () => {
    if (isSwitching) return;
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
            disabled={isSwitching}
            className={cn(
              'absolute right-6 md:right-10 top-1/2 -translate-y-1/2',
              'flex items-center justify-center w-10 h-10 rounded-livro',
              'bg-white border border-borda text-oliva hover:text-tinta hover:bg-pergaminho-escuro',
              'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja',
              isSwitching && 'opacity-50 cursor-not-allowed'
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
          className={cn(
            'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 md:gap-8 max-w-3xl w-full',
            isSwitching && 'pointer-events-none'
          )}
          role="list"
          aria-label="Perfis de crianças"
          aria-busy={isSwitching}
        >
          {profiles.map((profile) => {
            const isSelecting = selectingProfileId === profile.id;
            const isActive = activeProfile?.id === profile.id;

            return (
              <button
                key={profile.id}
                type="button"
                role="listitem"
                disabled={isSwitching}
                aria-busy={isSelecting}
                aria-disabled={isSwitching && !isSelecting}
                onClick={() => void handleSelect(profile.id)}
                className={cn(
                  'group flex flex-col items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja rounded-livro p-2',
                  isSwitching && !isSelecting && 'opacity-50'
                )}
              >
                <div className="relative">
                  <ChildProfileAvatar
                    profile={profile}
                    size="xl"
                    active={isActive}
                    className={cn(
                      'transition-all duration-300',
                      !isSelecting &&
                        'group-hover:scale-[1.04] group-hover:shadow-livro-lg group-hover:ring-4 group-hover:ring-laranja/35',
                      !isSelecting &&
                        'group-focus-visible:scale-[1.04] group-focus-visible:ring-4 group-focus-visible:ring-laranja/50',
                      isSelecting && 'scale-[1.04] ring-4 ring-laranja/60 shadow-livro-lg'
                    )}
                  />
                  {isSelecting && (
                    <>
                      <div
                        className="absolute inset-0 rounded-full bg-tinta/25 backdrop-blur-[1px]"
                        aria-hidden="true"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ProfileSelectSpinner />
                      </div>
                      <span className="sr-only">
                        {getProfileSwitchStatusLabel(profile.name)}
                      </span>
                    </>
                  )}
                </div>
                <div className="text-center">
                  <p
                    className={cn(
                      'font-display font-bold text-tinta text-base md:text-lg transition-colors',
                      !isSwitching && 'group-hover:text-laranja',
                      isSelecting && 'text-laranja'
                    )}
                  >
                    {profile.name}
                  </p>
                  <p className="text-xs text-oliva mt-0.5">
                    {getAgeGroupLabel(profile.preferences.ageGroup)}
                  </p>
                </div>
              </button>
            );
          })}

          {canAddProfile && (
            <button
              type="button"
              onClick={handleAddProfile}
              disabled={isSwitching}
              aria-disabled={isSwitching}
              className={cn(
                'group flex flex-col items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja rounded-livro p-2',
                isSwitching && 'opacity-50'
              )}
            >
              <div
                className={cn(
                  'w-28 h-28 md:w-32 md:h-32 rounded-full border-2 border-dashed border-borda',
                  'bg-white/60 flex items-center justify-center',
                  !isSwitching &&
                    'group-hover:border-laranja group-hover:bg-laranja/5 transition-all duration-300'
                )}
              >
                <span
                  className={cn(
                    'material-symbols-outlined text-4xl text-oliva transition-colors',
                    !isSwitching && 'group-hover:text-laranja'
                  )}
                >
                  add
                </span>
              </div>
              <p
                className={cn(
                  'font-display font-bold text-oliva text-base transition-colors',
                  !isSwitching && 'group-hover:text-laranja'
                )}
              >
                Adicionar filho
              </p>
            </button>
          )}
        </div>

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
