'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { ProgressBar } from '@/components/ProgressBar';
import { MascotTooltip } from '@/components/MascotTooltip';
import { SelectionCard } from '@/components/ui/SelectionCard';
import { ChipToggle } from '@/components/ui/ChipToggle';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { languageStyles, readingGoals } from '@/lib/onboarding/constants';
import { DEFAULT_PREFERENCES } from '@/lib/onboarding/defaults';
import { mergePreferences } from '@/lib/onboarding/storage';
import { loadOnboardingDraft, saveOnboardingDraft } from '@/lib/profiles/storage';
import { isNewProfileMode, withNewProfileMode } from '@/lib/onboarding/routing';
import { useRouter, useSearchParams } from 'next/navigation';

export function OnboardingStep2Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewProfile = isNewProfileMode(searchParams);
  const [selectedStyle, setSelectedStyle] = useState(DEFAULT_PREFERENCES.languageStyle);
  const [selectedGoal, setSelectedGoal] = useState(DEFAULT_PREFERENCES.readingGoal);

  useEffect(() => {
    const stored = loadOnboardingDraft();
    if (stored) {
      setSelectedStyle(stored.languageStyle);
      setSelectedGoal(stored.readingGoal);
    }
  }, []);

  const handleContinue = () => {
    const stored = loadOnboardingDraft();
    const base = stored ?? DEFAULT_PREFERENCES;
    saveOnboardingDraft(
      mergePreferences(
        {
          languageStyle: selectedStyle,
          readingGoal: selectedGoal,
        },
        base
      )
    );
    router.push(withNewProfileMode('/onboarding/step-3', isNewProfile));
  };

  return (
    <div className="bg-pergaminho textura-pergaminho min-h-screen flex flex-col">
      <Header logoHref={isNewProfile ? '/home' : undefined} />
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="max-w-[1000px] w-full bg-white rounded-livro shadow-livro-lg overflow-hidden flex flex-col md:flex-row border border-borda">
          <div className="flex-1 p-8 md:p-12">
            <ProgressBar currentStep={2} totalSteps={3} label="Estilo e tom" />

            <h1 className="font-display text-tinta text-3xl font-bold leading-tight mb-2">
              Como você quer contar as histórias?
            </h1>
            <p className="text-oliva mb-10 text-lg">
              Defina o tom de voz e o objetivo para que a experiência seja única.
            </p>

            <div className="space-y-10">
              <div className="flex flex-col gap-3">
                <span className="text-tinta text-lg font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-vida">auto_awesome</span>
                  Estilo de linguagem
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" role="group" aria-label="Estilo de linguagem">
                  {languageStyles.map((style) => (
                    <SelectionCard
                      key={style.id}
                      selected={selectedStyle === style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      icon={style.icon}
                      label={style.label}
                      sublabel={style.sublabel}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <span className="text-tinta text-lg font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-vida">target</span>
                  Objetivo da leitura
                </span>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Objetivo da leitura">
                  {readingGoals.map((goal) => (
                    <ChipToggle
                      key={goal.id}
                      selected={selectedGoal === goal.id}
                      onClick={() => setSelectedGoal(goal.id)}
                      label={goal.label}
                      icon={goal.icon}
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
            message="O estilo com rimas é perfeito para prender a atenção dos menorzinhos!"
            tip="Você pode mudar essas preferências a qualquer momento nas configurações."
          />
        </div>
      </main>
      <footer className="p-6 text-center text-oliva/70 text-sm">
        <p>© {new Date().getFullYear()} Pequenos Discípulos</p>
      </footer>
    </div>
  );
}
