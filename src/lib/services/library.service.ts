import { fromPrismaAgeTier, fromPrismaContentType } from '@/lib/domain/mappers';
import type { AdaptationRepository } from '@/lib/repositories/interfaces/adaptation.repository';
import type {
  UserStoryRepository,
  UserStoryWithRelations,
} from '@/lib/repositories/interfaces/user-story.repository';
import type { StorySummary } from '@/lib/stories';
import { STORY_IMAGE } from '@/lib/stories';
import { getAgeTierLabel } from '@/lib/stories/age-tiers';
import { formatAdaptationReference, parsePassageSourceVerses } from '@/lib/stories/bible-passages';
import type { UserStoryDetail } from '@/lib/repositories/interfaces/user-story.repository';
import type { BibleTextService } from '@/lib/services/bible-text.service';

export class LibraryService {
  constructor(
    private readonly adaptations: AdaptationRepository,
    private readonly userStories: UserStoryRepository,
    private readonly bibleText: BibleTextService
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

  private mapUserStorySummary(story: UserStoryWithRelations): StorySummary {
    const totalPages = story.progress?.totalPages ?? 4;
    const currentPage = story.progress?.currentPage ?? 1;
    const progress = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;
    const verseFrom = story.adaptation.verseFrom;
    const verseTo = story.adaptation.verseTo;

    return {
      id: story.id,
      title: story.adaptation.title,
      ageGroup: getAgeTierLabel(fromPrismaAgeTier(story.adaptation.ageTier)),
      passage: formatAdaptationReference(
        story.adaptation.passage.slug,
        verseFrom,
        verseTo,
        story.adaptation.passage.reference
      ),
      progress,
      totalPages,
      currentPage,
      image: story.adaptation.imageUrl ?? STORY_IMAGE,
      themes: [] as string[],
      isFavorite: story.isFavorite,
      defaultContentType: fromPrismaContentType(story.adaptation.contentType),
    };
  }

  private async mapUserStoryDetail(story: UserStoryWithRelations): Promise<UserStoryDetail> {
    const verseFrom = story.adaptation.verseFrom;
    const verseTo = story.adaptation.verseTo;

    let sourceVerses = parsePassageSourceVerses(
      story.adaptation.passage.sourceText,
      verseFrom,
      verseTo
    );
    let sourceVersesError: string | undefined;

    if (sourceVerses.length === 0) {
      const resolved = await this.bibleText.resolvePassageVerses({
        passage: {
          id: story.adaptation.passageId,
          slug: story.adaptation.passage.slug,
          sourceText: story.adaptation.passage.sourceText,
        },
        verseFrom,
        verseTo,
        bibleVersionId: story.adaptation.bibleVersionId,
      });
      sourceVerses = resolved.verses;
      sourceVersesError = resolved.error;
    }

    return {
      summary: this.mapUserStorySummary(story),
      adaptationId: story.adaptation.id,
      passageSlug: story.adaptation.passage.slug,
      verseFrom,
      verseTo,
      bibleVersionId: story.adaptation.bibleVersionId,
      sourceVerses,
      sourceVersesError,
    };
  }

  async getUserStory(userId: string, storyId: string) {
    const story = await this.userStories.findById(storyId);
    if (!story || story.userId !== userId) return null;
    return this.mapUserStoryDetail(story);
  }

  async listForUser(userId: string, childProfileId?: string): Promise<StorySummary[]> {
    const stories = await this.userStories.listByUser(userId, childProfileId);

    return stories.map((story) => this.mapUserStorySummary(story));
  }
}
