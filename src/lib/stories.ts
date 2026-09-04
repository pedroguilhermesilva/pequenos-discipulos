import type { ContentType } from './stories/types';
import { getPassageIdFromReference } from './stories/bible-passages';
import { buildStoryUrl } from './stories/story-url';

export interface StorySummary {
  id: string;
  title: string;
  ageGroup: string;
  passage: string;
  progress?: number;
  totalPages: number;
  currentPage?: number;
  image: string;
  themes: string[];
  isFavorite?: boolean;
  defaultContentType?: ContentType;
}

/** Build the correct URL based on whether the story has been started */
export function getStoryHref(story: StorySummary): string {
  const passageId = getPassageIdFromReference(story.passage);
  const hasProgress = (story.progress ?? 0) > 0;

  if (hasProgress && passageId) {
    return buildStoryUrl(story.id, {
      passageId,
      contentType: story.defaultContentType ?? 'text',
      ready: true,
    });
  }

  return buildStoryUrl(story.id);
}

export const STORY_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB89eUgSLruHC-RwRPJZRWJA4xQfPTPw6aIRlDzdU0iyH5E9PrVoLN8FxZgvdYjgY6Tn9eZsTnVnrQ_UfJXNPo0ffSk0QBjl_UvandzkfbiKU1Y13uiahFEIHy25OZle0UoPcSwTh7DkiEHdV4ykLBhOSLEWszJsFN9hVxezvnFKIrizbKfPG99QHR4eC34aEOkU_7AlbbUBR7E2M5SRPrSmCWoJsqEJPc5tPKlDIKvEdfhw8cJJYKDTTHKyH0kAHDjRdBbCZtj9nQD';
