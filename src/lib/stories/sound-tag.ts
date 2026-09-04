import type { AudioBlockKind } from '@/lib/stories/audio-play';

const SOUND_TAG_HINTS: Record<string, string> = {
  vento_tempestade_mar:
    'strong ocean wind and waves during a storm, whoosh and splash, dramatic but child-friendly, short',
  som_mar_vermelho: 'calm then rising ocean waves, parting sea ambience, magical, child-friendly, short',
  multidao_hosana:
    'joyful crowd cheering hosanna, children celebration, distant, short, child-friendly',
  multidao_alegria: 'cheerful crowd applause and joyful murmur, celebration, short, child-friendly',
  trovao_ceu: 'distant soft thunder rumble in the sky, brief, not scary, child-friendly',
  chuva_suave: 'gentle soft rain falling, light drizzle, short, child-friendly',
  passos_areia: 'soft footsteps on sand, calm desert walk, short, child-friendly',
  estrela_brilho: 'gentle magical star twinkle shimmer, short, soft, child-friendly',
  fogo_suave: 'soft warm campfire crackling, cozy, short, child-friendly',
  anjos_canto: 'soft gentle angelic choir hum, magical, short, child-friendly',
  ovelhas_balido: 'gentle soft sheep bleat, cute pasture, short, child-friendly',
};

export function isSpeechSoundTag(tagSom: string): boolean {
  return tagSom.trim().toLowerCase().startsWith('fala_');
}

export function buildSfxPromptFromTag(tagSom: string, textoParaAudio?: string): string {
  const tag = tagSom.trim().toLowerCase();
  const catalog = SOUND_TAG_HINTS[tag];
  if (catalog) return catalog;

  const readable = tag.replace(/_/g, ' ');
  if (textoParaAudio?.trim()) {
    return `Child-friendly sound effect for "${readable}" inspired by: ${textoParaAudio.trim()}, short, soft`;
  }

  return `Gentle child-friendly sound effect for ${readable}, short, soft`;
}

export function resolveInteractiveAudioInput(input: {
  tagSom: string;
  textoParaAudio: string;
}): { kind: AudioBlockKind; text: string; sfxPrompt?: string } {
  if (isSpeechSoundTag(input.tagSom)) {
    return {
      kind: 'speech',
      text: input.textoParaAudio.trim() || input.tagSom,
    };
  }

  return {
    kind: 'sfx',
    text: input.tagSom,
    sfxPrompt: buildSfxPromptFromTag(input.tagSom, input.textoParaAudio),
  };
}
