import type {
  AgeGroupId,
  LanguageStyleId,
  PreferredFormatId,
  ReadingGoalId,
  ThemeId,
  UsageFrequencyId,
} from './types';

export const ageGroups: { id: AgeGroupId; label: string; icon: string }[] = [
  { id: '1-2', label: '1–2 anos', icon: 'child_care' },
  { id: '3-4', label: '3–4 anos', icon: 'toys' },
  { id: '5+', label: '5+ anos', icon: 'rocket_launch' },
];

export const themes: { id: ThemeId; label: string }[] = [
  { id: 'animals', label: 'Animais' },
  { id: 'stars', label: 'Estrelas' },
  { id: 'heroes', label: 'Heróis' },
  { id: 'nature', label: 'Natureza' },
  { id: 'music', label: 'Música' },
  { id: 'adventure', label: 'Aventura' },
];

export const languageStyles: {
  id: LanguageStyleId;
  label: string;
  sublabel?: string;
  icon: string;
}[] = [
  { id: 'simple', label: 'Muito simples', sublabel: '(1–2 anos)', icon: 'child_care' },
  { id: 'rhymes', label: 'Com rimas', icon: 'music_note' },
  { id: 'adventure', label: 'Aventuresco', icon: 'explore' },
];

import {
  bibleVersions,
  getBibleVersionLabel,
} from '@/lib/stories/bible-versions';

export { bibleVersions, getBibleVersionLabel };

export const readingGoals: { id: ReadingGoalId; label: string; icon: string }[] = [
  { id: 'bedtime', label: 'Hora de dormir', icon: 'bedtime' },
  { id: 'prayer', label: 'Momento de oração', icon: 'prayer_times' },
  { id: 'learning', label: 'Aprendizado', icon: 'school' },
  { id: 'fun', label: 'Diversão', icon: 'mood' },
];

export const preferredFormats: {
  id: PreferredFormatId;
  label: string;
  sublabel?: string;
  icon: string;
}[] = [
  { id: 'story', label: 'Conto', sublabel: '(Texto)', icon: 'description' },
  { id: 'script', label: 'Roteiro', sublabel: '(Áudio)', icon: 'headphones' },
  { id: 'video', label: 'Vídeo', sublabel: '(Storyboard)', icon: 'movie' },
];

export const usageFrequencies: { id: UsageFrequencyId; label: string; icon: string }[] = [
  { id: 'daily', label: 'Diariamente', icon: 'repeat' },
  { id: 'weekend', label: 'Finais de semana', icon: 'weekend' },
  { id: 'occasionally', label: 'Ocasionalmente', icon: 'event' },
];

export function getAgeGroupLabel(id: AgeGroupId): string {
  return ageGroups.find((g) => g.id === id)?.label ?? id;
}

export function getThemeLabel(id: ThemeId): string {
  return themes.find((t) => t.id === id)?.label ?? id;
}

export function getLanguageStyleLabel(id: LanguageStyleId): string {
  return languageStyles.find((s) => s.id === id)?.label ?? id;
}

export function getReadingGoalLabel(id: ReadingGoalId): string {
  return readingGoals.find((g) => g.id === id)?.label ?? id;
}

export function getPreferredFormatLabel(id: PreferredFormatId): string {
  return preferredFormats.find((f) => f.id === id)?.label ?? id;
}

export function getUsageFrequencyLabel(id: UsageFrequencyId): string {
  return usageFrequencies.find((f) => f.id === id)?.label ?? id;
}
