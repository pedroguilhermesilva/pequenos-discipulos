import type { StoryReviewResponse } from '@/lib/llm/story-moderation.prompt';
import type {
  StoryReviewParams,
  StoryReviewProvider,
} from '@/lib/providers/interfaces/story-review.provider';

export class StubStoryReviewProvider implements StoryReviewProvider {
  constructor(private readonly defaultResult: StoryReviewResponse = {
    verdict: 'approved',
    reason: 'Aprovado automaticamente (stub).',
    biblicalFidelityOk: true,
    ageAppropriateOk: true,
  }) {}

  async review(_params: StoryReviewParams): Promise<StoryReviewResponse> {
    return this.defaultResult;
  }
}
