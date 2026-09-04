import type { PassageAdaptation, PrismaClient } from '@prisma/client';
import type {
  AdaptationLookupKey,
  AdaptationRepository,
  CreateAdaptationInput,
  LibraryFilters,
} from '@/lib/repositories/interfaces/adaptation.repository';

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
      },
      orderBy: [{ status: 'desc' }, { voteScore: 'desc' }, { version: 'desc' }],
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
        status: filters.status
          ? { in: filters.status }
          : { in: ['community', 'as_default', 'family_approved'] },
        ageTier: filters.ageTier,
        contentType: filters.contentType,
      },
      orderBy: [{ voteScore: 'desc' }, { updatedAt: 'desc' }],
      take: filters.limit ?? 50,
    });
  }

  listCommunityVersions(params: {
    passageId: string;
    ageTier: AdaptationLookupKey['ageTier'];
    bibleVersionId: string;
    verseFrom: number;
    verseTo: number;
  }): Promise<PassageAdaptation[]> {
    return this.prisma.passageAdaptation.findMany({
      where: {
        passageId: params.passageId,
        ageTier: params.ageTier,
        bibleVersionId: params.bibleVersionId,
        verseFrom: params.verseFrom,
        verseTo: params.verseTo,
        status: { in: ['community', 'as_default', 'family_approved'] },
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
