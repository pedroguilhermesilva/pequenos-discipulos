'use client';

import { cn } from '@/lib/cn';
import type { AudioBlockKind, StoryAudioPlayRequest } from '@/lib/stories/audio-play';

export type AudioPillVariant = 'efeito' | 'fala' | 'ambiente';

interface AudioPillProps {
  label: string;
  variant?: AudioPillVariant;
  blockKey: string;
  kind?: AudioBlockKind;
  playText?: string;
  tagSom?: string;
  onPlay?: (request: StoryAudioPlayRequest) => void;
  audioTitle?: string;
  audioDescription?: string;
  audioPath?: string;
  sfxPrompt?: string;
  className?: string;
}

const variantClass: Record<AudioPillVariant, string> = {
  efeito: 'audio-pill--efeito',
  fala: 'audio-pill--fala',
  ambiente: 'audio-pill--ambiente',
};

const variantDescription: Record<AudioPillVariant, string> = {
  efeito: 'Efeito sonoro',
  fala: 'Fala do personagem',
  ambiente: 'Ambiente imersivo',
};

function kindForVariant(variant: AudioPillVariant): AudioBlockKind {
  return variant === 'fala' ? 'speech' : 'sfx';
}

export function AudioPill({
  label,
  variant = 'efeito',
  blockKey,
  kind,
  playText,
  tagSom,
  onPlay,
  audioTitle,
  audioDescription,
  audioPath,
  sfxPrompt,
  className,
}: AudioPillProps) {
  const title = audioTitle ?? label;
  const description = audioDescription ?? variantDescription[variant];
  const resolvedKind = kind ?? kindForVariant(variant);
  const resolvedText = playText ?? title;

  return (
    <button
      type="button"
      onClick={() =>
        onPlay?.({
          blockKey,
          kind: resolvedKind,
          text: resolvedText,
          title,
          description,
          audioPath,
          sfxPrompt,
          tagSom,
          textoParaAudio: playText,
        })
      }
      className={cn('audio-pill', variantClass[variant], className)}
      aria-label={`Ouvir: ${title}`}
    >
      <span>{label}</span>
      <span className="material-symbols-outlined text-lg animate-shimmer">volume_up</span>
    </button>
  );
}
