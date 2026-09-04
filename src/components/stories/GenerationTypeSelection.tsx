'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ContentType } from '@/lib/stories/types';
import { contentTypeConfig } from '@/lib/stories/content-type';
import {
  formatPassageReference,
  getPassageById,
  type PassageRange,
} from '@/lib/stories/bible-passages';
import { buildStoryUrl } from '@/lib/stories/story-url';
import { SelectionCard } from '@/components/ui/SelectionCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

const generationTypes: Array<{
  id: ContentType;
  label: string;
  sublabel: string;
  description: string;
}> = [
  {
    id: 'text',
    label: 'Texto',
    sublabel: 'Conto ilustrado',
    description: 'História com palavras interativas e ilustrações para ler juntos.',
  },
  {
    id: 'audio',
    label: 'Áudio',
    sublabel: 'Narração',
    description: 'Versão narrada com sons e palavras destacadas para ouvir.',
  },
  {
    id: 'video',
    label: 'Vídeo',
    sublabel: 'Storyboard animado',
    description: 'Cenas animadas com narração para uma experiência visual.',
  },
];

interface GenerationTypeSelectionProps {
  storyId: string;
  passageId: string;
  passageRange: PassageRange;
}

export function GenerationTypeSelection({
  storyId,
  passageId,
  passageRange,
}: GenerationTypeSelectionProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const passage = getPassageById(passageId);
  const passageReference = passage
    ? formatPassageReference(passage, passageRange)
    : 'a passagem selecionada';

  const handleGenerate = () => {
    if (!selectedType) return;
    router.push(
      buildStoryUrl(storyId, {
        passageId,
        contentType: selectedType,
        verseFrom: passageRange.verseFrom,
        verseTo: passageRange.verseTo,
      })
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="space-y-2">
        <Link
          href={buildStoryUrl(storyId, {
            passageId,
            verseFrom: passageRange.verseFrom,
            verseTo: passageRange.verseTo,
          })}
          className="inline-flex items-center gap-2 text-oliva hover:text-tinta transition-colors font-semibold text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja rounded mb-4"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Voltar
        </Link>
        <p className="text-oliva text-sm font-semibold uppercase tracking-widest">Passo 2 de 2</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-tinta">
          Como deseja gerar a história?
        </h1>
        <p className="text-oliva text-lg max-w-2xl">
          Escolha o formato da adaptação para{' '}
          <strong className="text-tinta">{passageReference}</strong>.
        </p>
      </header>

      {passage && (
        <div className="bg-white rounded-livro border border-borda p-5 shadow-livro">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-laranja">history_edu</span>
            <div>
              <p className="text-xs font-bold text-laranja uppercase tracking-wider">
                Passagem selecionada
              </p>
              <p className="font-display font-bold text-tinta">{passageReference}</p>
            </div>
          </div>
        </div>
      )}

      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        role="radiogroup"
        aria-label="Tipo de geração"
      >
        {generationTypes.map((type) => {
          const config = contentTypeConfig[type.id];
          return (
            <div key={type.id} className="flex flex-col gap-3">
              <SelectionCard
                selected={selectedType === type.id}
                onClick={() => setSelectedType(type.id)}
                icon={config.icon}
                label={type.label}
                sublabel={type.sublabel}
              />
              <p className="text-xs text-oliva text-center px-2">{type.description}</p>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-2">
        <PrimaryButton
          onClick={handleGenerate}
          disabled={!selectedType}
          icon={<span className="material-symbols-outlined">auto_awesome</span>}
        >
          Gerar história
        </PrimaryButton>
      </div>
    </div>
  );
}
