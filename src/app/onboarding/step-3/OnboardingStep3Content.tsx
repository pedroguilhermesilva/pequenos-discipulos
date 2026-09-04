'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { ProgressBar } from '@/components/ProgressBar';
import { MascotTooltip } from '@/components/MascotTooltip';
import { SelectionCard } from '@/components/ui/SelectionCard';
import { ChipToggle } from '@/components/ui/ChipToggle';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { preferredFormats, usageFrequencies } from '@/lib/onboarding/constants';
import { DEFAULT_PREFERENCES } from '@/lib/onboarding/defaults';
import { mergePreferences } from '@/lib/onboarding/storage';
import {
  addProfile,
  clearOnboardingDraft,
  loadOnboardingDraft,
} from '@/lib/profiles/storage';
import { isNewProfileMode } from '@/lib/onboarding/routing';
import { useRouter, useSearchParams } from 'next/navigation';

export function OnboardingStep3Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewProfile = isNewProfileMode(searchParams);
  const [selectedFormat, setSelectedFormat] = useState(DEFAULT_PREFERENCES.preferredFormat);
  const [selectedFrequency, setSelectedFrequency] = useState(DEFAULT_PREFERENCES.usageFrequency);

  useEffect(() => {
    const stored = loadOnboardingDraft();
    if (stored) {
      setSelectedFormat(stored.preferredFormat);
      setSelectedFrequency(stored.usageFrequency);
    }
  }, []);

  const handleFinish = async () => {
    const stored = loadOnboardingDraft();
    const base = stored ?? DEFAULT_PREFERENCES;
    const preferences = mergePreferences(
      {
        preferredFormat: selectedFormat,
        usageFrequency: selectedFrequency,
      },
      base
    );

    addProfile(preferences);
    clearOnboardingDraft();
    router.push('/home');
  };

  return (
    <div className="bg-pergaminho textura-pergaminho min-h-screen flex flex-col">
      <Header logoHref={isNewProfile ? '/home' : undefined} />
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="max-w-[1000px] w-full bg-white rounded-livro shadow-livro-lg overflow-hidden flex flex-col md:flex-row border border-borda">
          <div className="flex-1 p-8 md:p-12">
            <ProgressBar currentStep={3} totalSteps={3} label="Finalização" />

            <h1 className="font-display text-tinta text-3xl font-bold leading-tight mb-2">
              Tudo pronto para começar!
            </h1>
            <p className="text-oliva mb-10 text-lg">
              Escolha o formato que você mais gosta para suas histórias.
            </p>

            <div className="space-y-10">
              <div className="flex flex-col gap-3">
                <span className="text-tinta text-lg font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-vida">view_quilt</span>
                  Formato preferido
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" role="group" aria-label="Formato preferido">
                  {preferredFormats.map((format) => (
                    <SelectionCard
                      key={format.id}
                      selected={selectedFormat === format.id}
                      onClick={() => setSelectedFormat(format.id)}
                      icon={format.icon}
                      label={format.label}
                      sublabel={format.sublabel}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <span className="text-tinta text-lg font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-vida">calendar_month</span>
                  Frequência de uso
                </span>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Frequência de uso">
                  {usageFrequencies.map((freq) => (
                    <ChipToggle
                      key={freq.id}
                      selected={selectedFrequency === freq.id}
                      onClick={() => setSelectedFrequency(freq.id)}
                      label={freq.label}
                      icon={freq.icon}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-12">
              <PrimaryButton
                onClick={handleFinish}
                fullWidth
                className="h-14 text-lg"
                icon={<span className="material-symbols-outlined">auto_stories</span>}
              >
                Ir para o início
              </PrimaryButton>
            </div>
          </div>

          <MascotTooltip
            message="Oba! Mal posso esperar para contar histórias com você!"
            title="Comemore conosco!"
            tip="Sua jornada personalizada está pronta. Vamos descobrir novas histórias juntos?"
            celebrate
          />
        </div>
      </main>
      <footer className="p-6 text-center text-oliva/70 text-sm">
        <p>© {new Date().getFullYear()} Pequenos Discípulos</p>
      </footer>
    </div>
  );
}
