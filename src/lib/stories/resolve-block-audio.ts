import type { AudioBlockKind } from '@/lib/stories/audio-play';
import { resolveInteractiveAudioInput } from '@/lib/stories/sound-tag';

export type EnsureBlockAudioInput = {
  kind: AudioBlockKind;
  text: string;
  sfxPrompt?: string;
};

export type StoryInteractivePart =
  | {
      type: 'word';
      value: string;
      variant?: 'default' | 'vida';
      sfxPrompt?: string;
    }
  | {
      type: 'audio-pill';
      label: string;
      variant?: 'efeito' | 'narracao' | 'ambiente';
      sfxPrompt?: string;
    }
  | {
      type: 'interactive';
      rotulo: string;
      textoParaAudio: string;
      tagSom: string;
    };

/** Maps story part types to TTS speech vs ElevenLabs SFX for interactive playback. */
export function resolveBlockAudioInput(part: StoryInteractivePart): EnsureBlockAudioInput {
  if (part.type === 'interactive') {
    return resolveInteractiveAudioInput({
      tagSom: part.tagSom,
      textoParaAudio: part.textoParaAudio,
    });
  }

  if (part.type === 'word') {
    return {
      kind: 'sfx',
      text: part.value ?? '',
      sfxPrompt: part.sfxPrompt,
    };
  }

  const label = part.label ?? '';
  if (part.variant === 'narracao') {
    return { kind: 'speech', text: label };
  }

  return {
    kind: 'sfx',
    text: label,
    sfxPrompt: part.sfxPrompt,
  };
}
