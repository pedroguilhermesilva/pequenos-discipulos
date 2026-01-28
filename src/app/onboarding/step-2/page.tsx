'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { ProgressBar } from '@/components/ProgressBar';
import { MascotTooltip } from '@/components/MascotTooltip';
import { useRouter } from 'next/navigation';

const languageStyles = [
  { id: 'simple', label: 'Muito Simples', sublabel: '(1-2 anos)', icon: 'child_care' },
  { id: 'rhymes', label: 'Com rimas', sublabel: '', icon: 'music_note' },
  { id: 'adventure', label: 'Aventuresco', sublabel: '', icon: 'explore' },
];

const readingGoals = [
  { id: 'bedtime', label: 'Hora de dormir', icon: 'bedtime' },
  { id: 'prayer', label: 'Momento de oração', icon: 'prayer_times' },
  { id: 'learning', label: 'Aprendizado', icon: 'school' },
  { id: 'fun', label: 'Diversão', icon: 'mood' },
];

export default function OnboardingStep2() {
  const router = useRouter();
  const [selectedStyle, setSelectedStyle] = useState('rhymes');
  const [selectedGoal, setSelectedGoal] = useState('bedtime');

  const handleContinue = () => {
    router.push('/onboarding/step-3');
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center p-6 @container">
        <div className="max-w-[1000px] w-full bg-white dark:bg-background-dark rounded-xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-[#dbe6de] dark:border-[#1e3a24]">
          <div className="flex-1 p-8 md:p-12">
            <ProgressBar currentStep={2} totalSteps={3} label="Estilo e Tom" />

            <h1 className="text-[#111813] dark:text-white text-3xl font-extrabold leading-tight mb-2">
              Como você quer contar as histórias?
            </h1>
            <p className="text-[#61896b] dark:text-gray-400 mb-10 text-lg">
              Defina o tom de voz e o objetivo para que a experiência seja única.
            </p>

            <div className="space-y-10">
              <div className="flex flex-col gap-3">
                <label className="text-[#111813] dark:text-white text-lg font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">auto_awesome</span>
                  Estilo de Linguagem
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {languageStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all group active:scale-95 text-center ${
                        selectedStyle === style.id
                          ? 'border-primary bg-primary/10'
                          : 'border-[#dbe6de] dark:border-[#1e3a24] hover:border-primary hover:bg-primary/5'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-4xl mb-2 ${
                        selectedStyle === style.id ? 'text-primary' : 'text-[#61896b] group-hover:text-primary'
                      }`}>
                        {style.icon}
                      </span>
                      <span className="font-bold dark:text-white leading-tight">
                        {style.label}
                        {style.sublabel && (
                          <><br/><span className="text-xs font-medium opacity-70">{style.sublabel}</span></>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-[#111813] dark:text-white text-lg font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">target</span>
                  Objetivo da Leitura
                </label>
                <div className="flex flex-wrap gap-2">
                  {readingGoals.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => setSelectedGoal(goal.id)}
                      className={`px-5 py-2.5 rounded-full border font-medium flex items-center gap-2 transition-colors ${
                        selectedGoal === goal.id
                          ? 'border-primary bg-primary text-white'
                          : 'border-[#dbe6de] dark:border-[#1e3a24] bg-white dark:bg-[#152a1a] text-[#111813] dark:text-white hover:border-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">{goal.icon}</span>
                      {goal.label}
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
                Continuar
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>

          <MascotTooltip
            message="O estilo com rimas é perfeito para prender a atenção dos menorzinhos!"
            title="Dica do Cordeirinho"
            tip="Você pode mudar essas preferências a qualquer momento nas configurações da história."
          />
        </div>
      </main>
      <footer className="p-6 text-center text-[#61896b] dark:text-gray-500 text-sm">
        <p>© 2024 Bíblia para Pequenos. Inteligência Artificial com valores eternos.</p>
      </footer>
    </div>
  );
}
