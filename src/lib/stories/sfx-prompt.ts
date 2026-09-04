const SFX_LABEL_HINTS: Record<string, string> = {
  estrela: 'gentle magical star twinkle, short, soft, child-friendly',
  'plim-plim': 'gentle magical twinkle chime, short, soft, child-friendly',
  'plim plim': 'gentle magical twinkle chime, short, soft, child-friendly',
  'plim, plim': 'gentle magical twinkle chime, short, soft, child-friendly',
  'plim, plim!': 'gentle magical twinkle chime, short, soft, child-friendly',
  'brilho da estrela guia': 'gentle guiding star shimmer, magical, short, child-friendly',
  'caminhada dos magos': 'soft desert footsteps on sand, calm night ambience, child-friendly',
  'noite no deserto': 'peaceful desert night ambience, soft wind, crickets, child-friendly',
  chuva: 'gentle soft rain falling, light drizzle, short, child-friendly',
  'som de chuva': 'gentle soft rain falling, light drizzle, short, child-friendly',
  raio: 'distant soft thunder rumble, brief, not scary, child-friendly',
  raios: 'distant soft thunder rumble, brief, not scary, child-friendly',
  trovão: 'distant soft thunder rumble, brief, not scary, child-friendly',
  trovao: 'distant soft thunder rumble, brief, not scary, child-friendly',
  vento: 'soft gentle breeze blowing, light wind rustle, short, child-friendly',
  mar: 'calm gentle ocean waves lapping shore, peaceful, short, child-friendly',
  ondas: 'calm gentle ocean waves lapping shore, peaceful, short, child-friendly',
  multidão: 'soft distant cheerful crowd murmur, celebration, short, child-friendly',
  multidao: 'soft distant cheerful crowd murmur, celebration, short, child-friendly',
  passos: 'soft footsteps on stone path, calm pace, short, child-friendly',
  ovelha: 'gentle soft sheep bleat, cute, short, child-friendly',
  cordeiro: 'gentle soft lamb bleat, cute, short, child-friendly',
  pássaro: 'cheerful small bird chirping, bright morning, short, child-friendly',
  passaro: 'cheerful small bird chirping, bright morning, short, child-friendly',
  fogo: 'soft warm campfire crackling, cozy, short, child-friendly',
  água: 'gentle stream water flowing, peaceful brook, short, child-friendly',
  agua: 'gentle stream water flowing, peaceful brook, short, child-friendly',
  jesus: 'soft gentle reverent harp chime, warm glow, short, child-friendly',
  deus: 'soft gentle reverent harp chime, warm glow, short, child-friendly',
  anjo: 'soft gentle angelic harp shimmer, magical, short, child-friendly',
  anjos: 'soft gentle angelic harp shimmer, magical, short, child-friendly',
  canto: 'soft gentle children choir hum, joyful, short, child-friendly',
  alabanza: 'soft gentle joyful praise chime, warm, short, child-friendly',
  'som da estrela': 'gentle magical star twinkle, short, soft, child-friendly',
};

function normalizeLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[!?.,…]+$/g, '');
}

export function buildSfxPrompt(label: string, sfxPrompt?: string): string {
  if (sfxPrompt?.trim()) {
    return sfxPrompt.trim();
  }

  const normalized = normalizeLabel(label);
  const hint = SFX_LABEL_HINTS[normalized];
  if (hint) {
    return hint;
  }

  return `Gentle child-friendly sound effect inspired by "${label.trim()}", short, soft`;
}
