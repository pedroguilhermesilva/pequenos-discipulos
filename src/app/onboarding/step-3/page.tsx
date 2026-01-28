'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { ProgressBar } from '@/components/ProgressBar';
import { MascotTooltip } from '@/components/MascotTooltip';
import { useRouter } from 'next/navigation';

const formats = [
  { id: 'story', label: 'Conto', sublabel: '(Texto)', icon: 'description' },
  { id: 'script', label: 'Roteiro', sublabel: '(Áudio)', icon: 'headphones' },
  { id: 'video', label: 'Vídeo', sublabel: '(Storyboard)', icon: 'movie' },
];

const frequencies = [
  { id: 'daily', label: 'Diariamente', icon: 'repeat' },
  { id: 'weekend', label: 'Finais de Semana', icon: 'weekend' },
  { id: 'occasionally', label: 'Ocasionalmente', icon: 'event' },
];

export default function OnboardingStep3() {
  const router = useRouter();
  const [selectedFormat, setSelectedFormat] = useState('story');
  const [selectedFrequency, setSelectedFrequency] = useState('daily');

  const handleFinish = () => {
    router.push('/stories/1');
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center p-6 @container">
        <div className="max-w-[1000px] w-full bg-white dark:bg-background-dark rounded-xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-[#dbe6de] dark:border-[#1e3a24]">
          <div className="flex-1 p-8 md:p-12">
            <ProgressBar currentStep={3} totalSteps={3} label="Finalização" />

            <h1 className="text-[#111813] dark:text-white text-3xl font-extrabold leading-tight mb-2">
              Tudo pronto para começar!
            </h1>
            <p className="text-[#61896b] dark:text-gray-400 mb-10 text-lg">
              Escolha o formato que você mais gosta para suas histórias.
            </p>

            <div className="space-y-10">
              <div className="flex flex-col gap-3">
                <label className="text-[#111813] dark:text-white text-lg font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">view_quilt</span>
                  Formato Preferido
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {formats.map((format) => (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(format.id)}
                      className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all group active:scale-95 text-center ${
                        selectedFormat === format.id
                          ? 'border-primary bg-primary/10'
                          : 'border-[#dbe6de] dark:border-[#1e3a24] hover:border-primary hover:bg-primary/5'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-4xl mb-2 ${
                        selectedFormat === format.id ? 'text-primary' : 'text-[#61896b] group-hover:text-primary'
                      }`}>
                        {format.icon}
                      </span>
                      <span className="font-bold dark:text-white leading-tight">
                        {format.label}
                        <br />
                        <span className="text-xs font-medium opacity-70">{format.sublabel}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-[#111813] dark:text-white text-lg font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">calendar_month</span>
                  Frequência de Uso
                </label>
                <div className="flex flex-wrap gap-2">
                  {frequencies.map((freq) => (
                    <button
                      key={freq.id}
                      onClick={() => setSelectedFrequency(freq.id)}
                      className={`px-5 py-2.5 rounded-full border font-medium flex items-center gap-2 transition-colors ${
                        selectedFrequency === freq.id
                          ? 'border-primary bg-primary text-white'
                          : 'border-[#dbe6de] dark:border-[#1e3a24] bg-white dark:bg-[#152a1a] text-[#111813] dark:text-white hover:border-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">{freq.icon}</span>
                      {freq.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-12">
              <button
                onClick={handleFinish}
                className="w-full h-16 bg-primary hover:bg-primary/90 text-[#102215] font-extrabold text-xl rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
              >
                Finalizar e Explorar
                <span className="material-symbols-outlined">celebration</span>
              </button>
            </div>
          </div>

          <div className="w-full md:w-[320px] bg-[#f0f9f2] dark:bg-[#152a1a] p-8 flex flex-col items-center justify-center text-center border-l border-[#dbe6de] dark:border-[#1e3a24]">
            <div className="mb-6 relative">
              <div className="bg-white dark:bg-background-dark p-4 rounded-xl shadow-sm border border-[#dbe6de] dark:border-[#1e3a24] mb-6 relative">
                <p className="text-[#111813] dark:text-white text-sm font-medium">
                  Oba! Mal posso esperar para contar histórias com você!
                </p>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-background-dark border-b border-r border-[#dbe6de] dark:border-[#1e3a24] rotate-45"></div>
              </div>
              <div className="relative">
                <div
                  className="w-48 h-48 bg-center bg-no-repeat bg-contain mx-auto"
                  aria-label="Ilustração amigável de um cordeirinho sorridente mascote do app"
                  style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBn3CQNYFbFi52iHGP5_VGyDnpNnynZz9eblzRI690X_88sSRld4RRBstkcoBSHgkllGwb8eUlAeo8qySuo7LFR47B3lQmygn9rsCD4FBt2os_Mv61PVuwv0uLxBTANuB36uRC2d22NyiLz4HP-5iSCTg_wNPjMPmunKhlNpfUtuuGPs7K_D1n6Hr_JydOSbRKFLJL-YS27ycxRdFB-ytia3d4Xp5BFszf5JerJA0X_7DXf1UN88_8hpSTCyMa-klhoicbTuW8QeOfN")' }}
                ></div>
                <div className="absolute -top-4 right-6 transform rotate-12">
                  <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>celebration</span>
                </div>
              </div>
            </div>
            <h3 className="text-[#111813] dark:text-white font-bold text-lg mb-2">Comemore Conosco!</h3>
            <p className="text-[#61896b] dark:text-gray-400 text-sm">
              Sua jornada personalizada está pronta para ser semeada. Vamos descobrir novas histórias juntos?
            </p>
          </div>
        </div>
      </main>
      <footer className="p-6 text-center text-[#61896b] dark:text-gray-500 text-sm">
        <p>© 2024 Bíblia para Pequenos. Inteligência Artificial com valores eternos.</p>
      </footer>
    </div>
  );
}
