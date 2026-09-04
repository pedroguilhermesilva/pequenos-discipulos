import type { ContentType, StoryContent } from './types';

export function inferContentType(content: unknown): ContentType {
  if (!content || typeof content !== 'object') return 'text';

  const story = content as StoryContent;

  if (story.type === 'video' || story.videoUrl) return 'video';
  if (story.type === 'audio' || story.audioUrl) return 'audio';

  if (Array.isArray(story.pages) && story.pages.length > 0) {
    if (story.pages.some((page) => page.videoUrl)) return 'video';
    const allAudioNoText = story.pages.every((page) => page.audioUrl && !page.text);
    if (allAudioNoText) return 'audio';
  }

  return 'text';
}

export const contentTypeConfig: Record<
  ContentType,
  { label: string; icon: string; badgeClass: string }
> = {
  text: {
    label: 'Texto',
    icon: 'menu_book',
    badgeClass: 'bg-ceu/10 text-ceu border-ceu/20',
  },
  audio: {
    label: 'Áudio',
    icon: 'headphones',
    badgeClass: 'bg-dourado/10 text-dourado border-dourado/30',
  },
  video: {
    label: 'Vídeo',
    icon: 'play_circle',
    badgeClass: 'bg-laranja/10 text-laranja border-laranja/20',
  },
};
