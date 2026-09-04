import type { AdaptationContent, StoryQuizData } from '@/lib/domain/schemas';
import type { AgeTier } from '@/lib/stories/age-tiers';
import type { ContentType } from '@/lib/stories/types';

export interface LlmGenerateStoryParams {
  sourceText: string;
  reference: string;
  ageTier: AgeTier;
  languageStyle: string;
  contentType: ContentType;
}

export interface LlmGenerateStoryResult {
  title: string;
  content: AdaptationContent;
  quiz?: StoryQuizData;
  adaptationNote?: string;
}

export interface LlmProvider {
  generateStory(params: LlmGenerateStoryParams): Promise<LlmGenerateStoryResult>;
}
