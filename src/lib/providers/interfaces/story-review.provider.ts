import type { StoryReviewResponse } from '@/lib/llm/story-moderation.prompt';
import type { AgeTier } from '@/lib/stories/age-tiers';

export type StoryReviewParams = {
  reference: string;
  ageTier: AgeTier;
  storyText: string;
};

export interface StoryReviewProvider {
  review(params: StoryReviewParams): Promise<StoryReviewResponse>;
}
