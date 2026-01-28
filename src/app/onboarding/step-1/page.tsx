'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { ProgressBar } from '@/components/ProgressBar';
import { MascotTooltip } from '@/components/MascotTooltip';
import { useRouter } from 'next/navigation';

const ageGroups = [
  { id: '1-2', label: '1-2 anos', icon: 'toys' },
  { id: '3-4', label: '3-4 anos', icon: 'sports_soccer' },
  { id: '5+', label: '5+ anos', icon: 'rocket_launch' },
];

const themes = [
  { id: 'animals', label: 'Animais' },
  { id: 'stars', label: 'Estrelas' },
  { id: 'heroes', label: 'Heróis' },
  { id: 'nature', label: 'Natureza' },
  { id: 'music', label: 'Música' },
  { id: 'adventure', label: 'Aventura' },
];

export default function OnboardingStep1() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [selectedAge, setSelectedAge] = useState('3-4');
  const [selectedThemes, setSelectedThemes] = useState<string[]>(['stars', 'music']);

  const toggleTheme = (themeId: string) => {
    setSelectedThemes((prev) =>
      prev.includes(themeId)
        ? prev.filter((t) => t !== themeId)
        : [...prev, themeId]
    );
  };

  const handleContinue = () => {
    router.push('/onboarding/step-2');
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center p-6 @container">
        <div className="max-w-[1000px] w-full bg-white dark:bg-background-dark rounded-xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-[#dbe6de] dark:border-[#1e3a24]">
          <div className="flex-1 p-8 md:p-12">
            <ProgressBar currentStep={1} totalSteps={3} label="Personalização" />

            <h1 className="text-[#111813] dark:text-white text-3xl font-extrabold leading-tight mb-2">
              Vamos conhecer seu pequeno?
            </h1>
            <p className="text-[#61896b] dark:text-gray-400 mb-10 text-lg">
              Conte-nos um pouco sobre a criança para que nossa IA personalize cada detalhe.
            </p>

            <div className="space-y-10">
              <div className="flex flex-col gap-3">
                <label className="text-[#111813] dark:text-white text-lg font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">person</span>
                  Qual o nome da criança?
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-14 rounded-xl border border-[#dbe6de] dark:border-[#1e3a24] bg-white dark:bg-[#152a1a] dark:text-white px-5 text-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-gray-300"
                  placeholder="Ex: Davi"
                />
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-[#111813] dark:text-white text-lg font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">cake</span>
                  Qual a idade?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {ageGroups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => setSelectedAge(group.id)}
                      className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all group active:scale-95 ${
                        selectedAge === group.id
                          ? 'border-primary bg-primary/10'
                          : 'border-[#dbe6de] dark:border-[#1e3a24] hover:border-primary hover:bg-primary/5'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-4xl mb-2 ${
                        selectedAge === group.id ? 'text-primary' : 'text-[#61896b] group-hover:text-primary'
                      }`}>
                        {group.icon}
                      </span>
                      <span className="font-bold dark:text-white">{group.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-[#111813] dark:text-white text-lg font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">favorite</span>
                  Quais temas ela mais gosta?
                </label>
                <div className="flex flex-wrap gap-2">
                  {themes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => toggleTheme(theme.id)}
                      className={`px-5 py-2.5 rounded-full border font-medium transition-colors ${
                        selectedThemes.includes(theme.id)
                          ? 'border-primary bg-primary text-white'
                          : 'border-[#dbe6de] dark:border-[#1e3a24] bg-white dark:bg-[#152a1a] text-[#111813] dark:text-white hover:border-primary'
                      }`}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-12">
              <button
                onClick={handleContinue}
                className="w-full h-16 bg-primary hover:bg-primary/90 text-[#102215] font-extrabold text-xl rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
              >
                Começar a Explorar
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>

          <MascotTooltip
            message="Isso ajuda a criar histórias perfeitas para o seu pequeno!"
            title="Dica do Cordeirinho"
            tip="Personalizar a idade garante que as histórias usem as palavras certas para cada fase do crescimento."
          />
        </div>
      </main>
      <footer className="p-6 text-center text-[#61896b] dark:text-gray-500 text-sm">
        <p>© 2024 Bíblia para Pequenos. Inteligência Artificial com valores eternos.</p>
      </footer>
    </div>
  );
}
