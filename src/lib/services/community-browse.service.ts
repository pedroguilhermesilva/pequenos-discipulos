import type { AgeTier, ContentType, PassageAdaptation } from '@prisma/client';
import { fromPrismaAgeTier } from '@/lib/domain/mappers';
import { extractAdaptationExcerpt } from '@/lib/community/adaptation-excerpt';
import type { AdaptationRepository } from '@/lib/repositories/interfaces/adaptation.repository';
import type { VoteRepository } from '@/lib/repositories/interfaces/vote.repository';
import { formatAdaptationReference } from '@/lib/stories/bible-passages';
import { getAgeTierLabel } from '@/lib/stories/age-tiers';

export type CommunityBrowseSort = 'votes' | 'recent';

export type CommunityBrowseFilters = {
  search?: string;
  ageTier?: AgeTier;
  sort: CommunityBrowseSort;
  page: number;
  limit?: number;
};

export type CommunityBrowseItem = {
  id: string;
  title: string;
  passageReference: string;
  book: string;
  ageTierLabel: string;
  excerpt: string;
  voteScore: number;
  voteCount: number;
  status: PassageAdaptation['status'];
  userVote: 1 | -1 | null;
  contentType: ContentType;
  updatedAt: string;
};

export type CommunityBrowsePage = {
  items: CommunityBrowseItem[];
  page: number;
  hasMore: boolean;
};

type PassageRow = {
  slug: string;
  reference: string;
  book: string;
  preview: string | null;
};

export class CommunityBrowseService {
  constructor(
    private readonly adaptations: AdaptationRepository,
    private readonly votes: VoteRepository
  ) {}

  async listForUser(userId: string, filters: CommunityBrowseFilters): Promise<CommunityBrowsePage> {
    const limit = filters.limit ?? 12;
    const page = Math.max(0, filters.page);
    const rows = await this.adaptations.listCommunityBrowse({
      search: filters.search?.trim() || undefined,
      ageTier: filters.ageTier,
      sort: filters.sort,
      skip: page * limit,
      take: limit + 1,
      excludeCreatedByUserId: userId,
    });

    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;

    const items = await Promise.all(slice.map((row) => this.mapRow(userId, row)));

    return { items, page, hasMore };
  }

  private async mapRow(
    userId: string,
    row: PassageAdaptation & { passage: PassageRow }
  ): Promise<CommunityBrowseItem> {
    const vote = await this.votes.findByUserAndAdaptation(userId, row.id);
    const userVote: 1 | -1 | null =
      vote?.value === -1 ? -1 : vote?.value === 1 ? 1 : null;

    const appTier = fromPrismaAgeTier(row.ageTier);

    return {
      id: row.id,
      title: row.title,
      book: row.passage.book,
      passageReference: formatAdaptationReference(
        row.passage.slug,
        row.verseFrom,
        row.verseTo,
        row.passage.reference
      ),
      ageTierLabel: getAgeTierLabel(appTier),
      excerpt: extractAdaptationExcerpt(
        row.content,
        row.adaptationNote,
        row.passage.preview ?? undefined
      ),
      voteScore: row.voteScore,
      voteCount: row.voteCount,
      status: row.status,
      userVote,
      contentType: row.contentType,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
