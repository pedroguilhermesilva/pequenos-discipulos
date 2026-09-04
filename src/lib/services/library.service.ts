import { fromPrismaAgeTier, fromPrismaContentType } from '@/lib/domain/mappers';
import type { AdaptationRepository } from '@/lib/repositories/interfaces/adaptation.repository';
import type {
  UserStoryRepository,
  UserStoryWithRelations,
} from '@/lib/repositories/interfaces/user-story.repository';
import type { StorySummary } from '@/lib/stories';
import { STORY_IMAGE } from '@/lib/stories';
import { getAgeTierLabel } from '@/lib/stories/age-tiers';
import { parsePassageSourceVerses } from '@/lib/stories/bible-passages';
import type { UserStoryDetail } from '@/lib/repositories/interfaces/user-story.repository';

export class LibraryService {
  constructor(
    private readonly adaptations: AdaptationRepository,
    private readonly userStories: UserStoryRepository
  ) {}

  async listCommunity(limit = 40): Promise<StorySummary[]> {
    const rows = await this.adaptations.listApproved({ limit });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      ageGroup: getAgeTierLabel(fromPrismaAgeTier(row.ageTier)),
      passage: '',
      progress: 0,
      totalPages: Array.isArray((row.content as { pages?: unknown[] })?.pages)
        ? ((row.content as { pages: unknown[] }).pages.length)
        : 4,
      image: row.imageUrl ?? STORY_IMAGE,
      themes: [],
      defaultContentType: fromPrismaContentType(row.contentType),
    }));
  }

  private mapUserStory(story: UserStoryWithRelations): UserStoryDetail {
    const totalPages = story.progress?.totalPages ?? 4;
    const currentPage = story.progress?.currentPage ?? 1;
    const progress = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;
    const verseFrom = story.adaptation.verseFrom;
    const verseTo = story.adaptation.verseTo;

    return {
      summary: {
        id: story.id,
        title: story.adaptation.title,
        ageGroup: getAgeTierLabel(fromPrismaAgeTier(story.adaptation.ageTier)),
        passage: story.adaptation.passage.reference,
        progress,
        totalPages,
        currentPage,
        image: story.adaptation.imageUrl ?? STORY_IMAGE,
        themes: [] as string[],
        isFavorite: story.isFavorite,
        defaultContentType: fromPrismaContentType(story.adaptation.contentType),
      } satisfies StorySummary,
      adaptationId: story.adaptation.id,
      passageSlug: story.adaptation.passage.slug,
      verseFrom,
      verseTo,
      sourceVerses: parsePassageSourceVerses(
        story.adaptation.passage.sourceText,
        verseFrom,
        verseTo
      ),
    };
  }

  async getUserStory(userId: string, storyId: string) {
    const story = await this.userStories.findById(storyId);
    if (!story || story.userId !== userId) return null;
    return this.mapUserStory(story);
  }

  async listForUser(userId: string, childProfileId?: string): Promise<StorySummary[]> {
    const stories = await this.userStories.listByUser(userId, childProfileId);

    return stories.map((story) => this.mapUserStory(story).summary);
  }
}
