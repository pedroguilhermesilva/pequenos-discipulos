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
  onPlay,
  className,
}: InteractiveWordProps) {
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
        })
      }
      className={cn(
        variant === 'vida' ? 'palavra-interativa-vida' : 'palavra-interativa',
        className
      )}
      aria-label={`Ouvir: ${audioTitle}`}
    >
      <span>{children}</span>
      <span className="material-symbols-outlined text-lg animate-shimmer">volume_up</span>
    </button>
  );
}
