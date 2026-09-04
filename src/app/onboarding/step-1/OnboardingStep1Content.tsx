'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { ProgressBar } from '@/components/ProgressBar';
import { MascotTooltip } from '@/components/MascotTooltip';
import { SelectionCard } from '@/components/ui/SelectionCard';
import { ChipToggle } from '@/components/ui/ChipToggle';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ageGroups, themes } from '@/lib/onboarding/constants';
import { DEFAULT_PREFERENCES } from '@/lib/onboarding/defaults';
import { mergePreferences } from '@/lib/onboarding/storage';
import {
  clearOnboardingDraft,
  loadOnboardingDraft,
  saveOnboardingDraft,
} from '@/lib/profiles/storage';
import type { ThemeId } from '@/lib/onboarding/types';
import { isNewProfileMode, withNewProfileMode } from '@/lib/onboarding/routing';
import { useRouter, useSearchParams } from 'next/navigation';

export function OnboardingStep1Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewProfile = isNewProfileMode(searchParams);
  const [name, setName] = useState('');
  const [selectedAge, setSelectedAge] = useState(DEFAULT_PREFERENCES.ageGroup);
  const [selectedThemes, setSelectedThemes] = useState<string[]>(DEFAULT_PREFERENCES.themes);

  useEffect(() => {
    if (isNewProfile) {
      clearOnboardingDraft();
      return;
    }
    const stored = loadOnboardingDraft();
    if (stored) {
      setName(stored.childName);
      setSelectedAge(stored.ageGroup);
      setSelectedThemes(stored.themes);
    }
  }, [isNewProfile]);

  const toggleTheme = (themeId: string) => {
    setSelectedThemes((prev) =>
      prev.includes(themeId) ? prev.filter((t) => t !== themeId) : [...prev, themeId]
    );
  };

  const handleContinue = () => {
    const stored = loadOnboardingDraft();
    const base = stored ?? DEFAULT_PREFERENCES;
    saveOnboardingDraft(
      mergePreferences(
        {
          childName: name,
          ageGroup: selectedAge,
          themes: selectedThemes as ThemeId[],
        },
        base
      )
    );
    router.push(withNewProfileMode('/onboarding/step-2', isNewProfile));
  };

  return (
    <div className="bg-pergaminho textura-pergaminho min-h-screen flex flex-col">
      <Header logoHref={isNewProfile ? '/home' : undefined} />
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="max-w-[1000px] w-full bg-white rounded-livro shadow-livro-lg overflow-hidden flex flex-col md:flex-row border border-borda">
          <div className="flex-1 p-8 md:p-12">
            <ProgressBar currentStep={1} totalSteps={3} label="Personalização" />

            <h1 className="font-display text-tinta text-3xl font-bold leading-tight mb-2">
              {isNewProfile ? 'Vamos conhecer mais um pequeno?' : 'Vamos conhecer seu pequeno?'}
            </h1>
            <p className="text-oliva mb-10 text-lg">
              Conte-nos sobre a criança para personalizar cada história.
            </p>

            <div className="space-y-10">
              <div className="flex flex-col gap-3">
                <label htmlFor="child-name" className="text-tinta text-lg font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-vida">person</span>
                  Qual o nome da criança?
                </label>
                <input
                  id="child-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-14 rounded-livro border border-borda bg-white text-tinta px-5 text-lg focus:ring-2 focus:ring-vida focus:border-vida outline-none transition-all placeholder:text-oliva/40"
                  placeholder="Ex: Davi"
                />
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-tinta text-lg font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-vida">cake</span>
                  Qual a idade?
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" role="group" aria-label="Idade da criança">
                  {ageGroups.map((group) => (
                    <SelectionCard
                      key={group.id}
                      selected={selectedAge === group.id}
                      onClick={() => setSelectedAge(group.id)}
                      icon={group.icon}
                      label={group.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <span className="text-tinta text-lg font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-vida">favorite</span>
                  Quais temas ela mais gosta?
                </span>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Temas preferidos">
                  {themes.map((theme) => (
                    <ChipToggle
                      key={theme.id}
                      selected={selectedThemes.includes(theme.id)}
                      onClick={() => toggleTheme(theme.id)}
                      label={theme.label}
                      themeId={theme.id}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-12">
              <PrimaryButton
                onClick={handleContinue}
                fullWidth
                className="h-14 text-lg"
                icon={<span className="material-symbols-outlined">arrow_forward</span>}
              >
                Continuar
              </PrimaryButton>
            </div>
          </div>

          <MascotTooltip
            message="Isso ajuda a criar histórias perfeitas para o seu pequeno!"
            tip="Personalizar a idade garante que as histórias usem as palavras certas para cada fase do crescimento."
          />
        </div>
      </main>
      <footer className="p-6 text-center text-oliva/70 text-sm">
        <p>© {new Date().getFullYear()} Pequenos Discípulos</p>
      </footer>
    </div>
  );
}
