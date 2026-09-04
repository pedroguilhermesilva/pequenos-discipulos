import { describe, expect, it } from 'vitest';
import { resolveBlockAudioInput } from '@/lib/stories/resolve-block-audio';

describe('resolveBlockAudioInput', () => {
  it('maps word parts to sfx using the label value', () => {
    expect(resolveBlockAudioInput({ type: 'word', value: 'estrela' })).toEqual({
      kind: 'sfx',
      text: 'estrela',
      sfxPrompt: undefined,
    });
  });

  it('passes explicit sfxPrompt for word parts', () => {
    expect(
      resolveBlockAudioInput({
        type: 'word',
        value: 'chuva',
        sfxPrompt: 'gentle rain drizzle',
      })
    ).toEqual({
      kind: 'sfx',
      text: 'chuva',
      sfxPrompt: 'gentle rain drizzle',
    });
  });

  it('keeps narracao audio-pills as speech', () => {
    expect(
      resolveBlockAudioInput({
        type: 'audio-pill',
        label: 'Disse o anjo',
        variant: 'narracao',
      })
    ).toEqual({
      kind: 'speech',
      text: 'Disse o anjo',
    });
  });

  it('maps pedagogical interactive blocks via tag_som', () => {
    expect(
      resolveBlockAudioInput({
        type: 'interactive',
        rotulo: 'Ouvir a tempestade',
        textoParaAudio: 'Fwoooosh!',
        tagSom: 'vento_tempestade_mar',
      })
    ).toMatchObject({
      kind: 'sfx',
      text: 'vento_tempestade_mar',
    });

    expect(
      resolveBlockAudioInput({
        type: 'interactive',
        rotulo: 'Ouvir Jesus',
        textoParaAudio: 'Coragem! Sou eu.',
        tagSom: 'fala_jesus_coragem',
      })
    ).toEqual({
      kind: 'speech',
      text: 'Coragem! Sou eu.',
    });
  });

  it('maps efeito and ambiente audio-pills to sfx', () => {
    expect(
      resolveBlockAudioInput({
        type: 'audio-pill',
        label: 'Som de chuva',
        variant: 'efeito',
        sfxPrompt: 'soft rain',
      })
    ).toEqual({
      kind: 'sfx',
      text: 'Som de chuva',
      sfxPrompt: 'soft rain',
    });

    expect(
      resolveBlockAudioInput({
        type: 'audio-pill',
        label: 'Noite no deserto',
        variant: 'ambiente',
      })
    ).toEqual({
      kind: 'sfx',
      text: 'Noite no deserto',
      sfxPrompt: undefined,
    });
  });
});
