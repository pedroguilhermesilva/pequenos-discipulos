import type { PassageAdaptation, PrismaClient } from '@prisma/client';
import {
  CACHEABLE_STATUSES,
  COMMUNITY_VISIBLE_STATUSES,
} from '@/lib/moderation/constants';
import type {
  AdaptationLookupKey,
  AdaptationRepository,
  CommunityBrowseQuery,
  CreateAdaptationInput,
  LibraryFilters,
} from '@/lib/repositories/interfaces/adaptation.repository';

function excludeAdaptationsCreatedBy(userId?: string) {
  if (!userId) return {};
  return {
    OR: [{ createdByUserId: { not: userId } }, { createdByUserId: null }],
  };
}

export class PrismaAdaptationRepository implements AdaptationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByCacheKey(key: AdaptationLookupKey): Promise<PassageAdaptation | null> {
    return this.prisma.passageAdaptation.findFirst({
      where: {
        passageId: key.passageId,
        bibleVersionId: key.bibleVersionId,
        verseFrom: key.verseFrom,
        verseTo: key.verseTo,
        ageTier: key.ageTier,
        languageStyle: key.languageStyle,
        contentType: key.contentType,
        status: { in: CACHEABLE_STATUSES },
      },
      orderBy: [{ voteScore: 'desc' }, { version: 'desc' }],
    });
  }

  findById(id: string) {
    return this.prisma.passageAdaptation.findUnique({
      where: { id },
      include: {
        passage: { select: { slug: true, reference: true, book: true } },
      },
    });
  }

  create(data: CreateAdaptationInput): Promise<PassageAdaptation> {
    return this.prisma.passageAdaptation.create({
      data: {
        ...data,
        status: data.status ?? 'draft',
        version: data.version ?? 1,
      },
    });
  }

  listApproved(filters: LibraryFilters = {}): Promise<PassageAdaptation[]> {
    return this.prisma.passageAdaptation.findMany({
      where: {
        status: filters.status ? { in: filters.status } : { in: CACHEABLE_STATUSES },
        ageTier: filters.ageTier,
        contentType: filters.contentType,
      },
      orderBy: [{ voteScore: 'desc' }, { updatedAt: 'desc' }],
      take: filters.limit ?? 50,
    });
  }

  listCommunityBrowse(query: CommunityBrowseQuery) {
    const search = query.search?.trim();
    return this.prisma.passageAdaptation.findMany({
      where: {
        status: { in: COMMUNITY_VISIBLE_STATUSES },
        ...(query.ageTier ? { ageTier: query.ageTier } : {}),
        ...excludeAdaptationsCreatedBy(query.excludeCreatedByUserId),
        ...(search
          ? {
              passage: {
                OR: [
                  { book: { contains: search, mode: 'insensitive' } },
                  { reference: { contains: search, mode: 'insensitive' } },
                  { slug: { contains: search, mode: 'insensitive' } },
                ],
              },
            }
          : {}),
      },
      include: {
        passage: {
          select: { slug: true, reference: true, book: true, preview: true },
        },
      },
      orderBy:
        query.sort === 'recent'
          ? [{ updatedAt: 'desc' }, { id: 'desc' }]
          : [{ voteScore: 'desc' }, { voteCount: 'desc' }, { id: 'desc' }],
      skip: query.skip,
      take: query.take,
    });
  }

  listCommunityVersions(params: {
    passageId: string;
    ageTier: AdaptationLookupKey['ageTier'];
    bibleVersionId: string;
    verseFrom: number;
    verseTo: number;
    excludeCreatedByUserId?: string;
  }): Promise<PassageAdaptation[]> {
    return this.prisma.passageAdaptation.findMany({
      where: {
        passageId: params.passageId,
        ageTier: params.ageTier,
        bibleVersionId: params.bibleVersionId,
        verseFrom: params.verseFrom,
        verseTo: params.verseTo,
        status: { in: COMMUNITY_VISIBLE_STATUSES },
        ...excludeAdaptationsCreatedBy(params.excludeCreatedByUserId),
      },
      orderBy: [{ voteScore: 'desc' }, { version: 'desc' }],
    });
  }

  updateStatus(id: string, status: PassageAdaptation['status']) {
    return this.prisma.passageAdaptation.update({
      where: { id },
      data: { status },
    });
  }

  updateVotes(id: string, voteScore: number, voteCount: number) {
    return this.prisma.passageAdaptation.update({
      where: { id },
      data: { voteScore, voteCount },
    });
  }
}
