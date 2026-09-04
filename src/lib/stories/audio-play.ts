export type AudioBlockKind = 'speech' | 'sfx';

export interface StoryAudioPlayRequest {
  blockKey: string;
  kind: AudioBlockKind;
  text: string;
  title: string;
  description: string;
  audioPath?: string;
  sfxPrompt?: string;
  tagSom?: string;
  textoParaAudio?: string;
}
