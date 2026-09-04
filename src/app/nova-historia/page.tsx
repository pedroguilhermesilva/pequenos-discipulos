'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { useChildProfiles } from '@/components/profiles/ChildProfileProvider';
import { getAgeGroupLabel } from '@/lib/onboarding/constants';
import { getProfileDisplayName } from '@/lib/profiles/normalize';
import { getNewStoryHref } from '@/lib/stories/new-story';

const steps = [
  {
    icon: 'menu_book',
    title: 'Escolha a passagem',
    description: 'Selecione os versículos bíblicos que deseja adaptar.',
  },
  {
    icon: 'tune',
    title: 'Defina o formato',
    description: 'Texto, áudio ou vídeo — como seu pequeno prefere ouvir.',
  },
  {
    icon: 'auto_stories',
    title: 'Leia juntos',
    description: 'A história é gerada na idade certa, pronta para compartilhar.',
  },
];

function NovaHistoriaContent() {
  const router = useRouter();
  const { activeProfile, isReady } = useChildProfiles();

  const childName = activeProfile ? getProfileDisplayName(activeProfile) : 'seu filho';
  const ageGroup = activeProfile
    ? getAgeGroupLabel(activeProfile.preferences.ageGroup)
    : '';

  useEffect(() => {
    if (!isReady || !activeProfile?.hasCreatedStory) return;
    router.replace(getNewStoryHref());
  }, [activeProfile?.hasCreatedStory, isReady, router]);

  if (!isReady || activeProfile?.hasCreatedStory) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-10">
      <header className="space-y-4 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-vida/20 bg-vida/10">
          <span
            className="material-symbols-outlined text-3xl text-vida"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
        </div>
        <p className="text-sm font-semibold uppercase tracking-widest text-oliva">Nova história</p>
        <h1 className="font-display text-3xl font-bold leading-tight text-tinta md:text-4xl">
          Crie uma história para o <span className="text-dourado">{childName}</span>
        </h1>
        <p className="mx-auto max-w-xl text-lg leading-relaxed text-oliva">
          Escolha uma passagem bíblica e nós adaptamos para{' '}
          <strong className="text-tinta">{ageGroup}</strong>, com palavras e ritmo certos para essa
          fase.
        </p>
      </header>

      <section
        aria-label="Como funciona"
        className="space-y-6 rounded-livro border border-borda bg-white p-6 shadow-livro md:p-8"
      >
        <h2 className="text-center font-display text-lg font-bold text-tinta">Como funciona</h2>
        <ol className="space-y-5">
          {steps.map((step, index) => (
            <li key={step.title} className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pergaminho-escuro font-display text-sm font-bold text-vida">
                {index + 1}
              </span>
              <div className="pt-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-vida">{step.icon}</span>
                  <h3 className="font-display font-bold text-tinta">{step.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-oliva">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          href={getNewStoryHref()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-livro bg-gradient-to-r from-amber to-laranja px-8 py-4 text-lg font-bold text-white shadow-livro transition-all hover:from-amber/90 hover:to-laranja/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja focus-visible:ring-offset-2 sm:w-auto"
        >
          Escolher passagem
          <span className="material-symbols-outlined">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}

export default function NovaHistoriaPage() {
  return (
    <AppShell>
      <NovaHistoriaContent />
    </AppShell>
  );
}
