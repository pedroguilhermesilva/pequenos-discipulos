export type ContentType = 'text' | 'audio' | 'video';

export interface StoryContent {
  type?: ContentType;
  videoUrl?: string;
  audioUrl?: string;
  pages?: Array<{
    text?: string;
    audioUrl?: string;
    videoUrl?: string;
  }>;
}

export interface FavoriteItem {
  id: string;
  title: string;
  contentType: ContentType;
  originalReference?: string | null;
  imageUrl?: string | null;
  readingGoal?: string | null;
  languageStyle?: string | null;
  savedAt: string;
}
