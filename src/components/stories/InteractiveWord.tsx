'use client';

import { cn } from '@/lib/cn';
import type { AudioBlockKind, StoryAudioPlayRequest } from '@/lib/stories/audio-play';

interface InteractiveWordProps {
  children: React.ReactNode;
  variant?: 'default' | 'vida';
  blockKey: string;
  kind?: AudioBlockKind;
  audioTitle: string;
  audioDescription?: string;
  audioPath?: string;
  sfxPrompt?: string;
  tagSom?: string;
  ariaLabel?: string;
  onPlay: (request: StoryAudioPlayRequest) => void;
  className?: string;
}

export function InteractiveWord({
  children,
  variant = 'default',
  blockKey,
  kind = 'sfx',
  audioTitle,
  audioDescription = 'Efeito sonoro',
  audioPath,
  sfxPrompt,
  tagSom,
  ariaLabel,
  onPlay,
  className,
}: InteractiveWordProps) {
  const label = ariaLabel ?? `Ouvir: ${audioTitle}`;

  return (
    <button
      type="button"
      onClick={() =>
        onPlay({
          blockKey,
          kind,
          text: audioTitle,
          title: audioTitle,
          description: audioDescription,
          audioPath,
          sfxPrompt,
          tagSom,
        })
      }
      className={cn(
        variant === 'vida' ? 'palavra-interativa-vida' : 'palavra-interativa',
        className
      )}
      aria-label={label}
    >
      <span>{children}</span>
      <span className="material-symbols-outlined text-lg animate-shimmer">volume_up</span>
    </button>
  );
}
