import type {
  ContentModerationProvider,
  ContentModerationResult,
} from '@/lib/providers/interfaces/content-moderation.provider';

export class StubContentModerationProvider implements ContentModerationProvider {
  constructor(private readonly defaultResult: ContentModerationResult = { flagged: false, categories: [] }) {}

  async moderate(): Promise<ContentModerationResult> {
    return this.defaultResult;
  }
}
