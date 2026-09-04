import { describe, expect, it } from 'vitest';
import {
  buildSfxPromptFromTag,
  isSpeechSoundTag,
  resolveInteractiveAudioInput,
} from '@/lib/stories/sound-tag';

describe('sound-tag', () => {
  it('detects speech tags by fala_ prefix', () => {
    expect(isSpeechSoundTag('fala_jesus_coragem')).toBe(true);
    expect(isSpeechSoundTag('vento_tempestade_mar')).toBe(false);
  });

  it('resolves speech interactive blocks to TTS text', () => {
    expect(
      resolveInteractiveAudioInput({
        tagSom: 'fala_jesus_coragem',
        textoParaAudio: 'Coragem! Sou eu.',
      })
    ).toEqual({
      kind: 'speech',
      text: 'Coragem! Sou eu.',
    });
  });

  it('resolves sfx interactive blocks with catalog prompt', () => {
    const result = resolveInteractiveAudioInput({
      tagSom: 'vento_tempestade_mar',
      textoParaAudio: 'Fwoooosh!',
    });

    expect(result.kind).toBe('sfx');
    expect(result.sfxPrompt).toBe(buildSfxPromptFromTag('vento_tempestade_mar', 'Fwoooosh!'));
  });
});
