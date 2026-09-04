import type {
  AdaptationStatus,
  AgeTier,
  ContentType,
  PassageAdaptation,
  Prisma,
} from '@prisma/client';

export type AdaptationLookupKey = {
  passageId: string;
  bibleVersionId: string;
  verseFrom: number;
  verseTo: number;
  ageTier: AgeTier;
  languageStyle: string;
  contentType: ContentType;
};

export type CreateAdaptationInput = {
  passageId: string;
  bibleVersionId: string;
  verseFrom: number;
  verseTo: number;
  ageTier: AgeTier;
  languageStyle: string;
  contentType: ContentType;
  content: Prisma.InputJsonValue;
  quiz?: Prisma.InputJsonValue;
  adaptationNote?: string;
  title: string;
  imageUrl?: string;
  status?: AdaptationStatus;
  version?: number;
};

export type LibraryFilters = {
  status?: AdaptationStatus[];
  ageTier?: AgeTier;
  contentType?: ContentType;
  limit?: number;
};

export interface AdaptationRepository {
  findByCacheKey(key: AdaptationLookupKey): Promise<PassageAdaptation | null>;
  findById(id: string): Promise<(PassageAdaptation & { passage: { slug: string; reference: string; book: string } }) | null>;
  create(data: CreateAdaptationInput): Promise<PassageAdaptation>;
  listApproved(filters?: LibraryFilters): Promise<PassageAdaptation[]>;
  listCommunityVersions(params: {
    passageId: string;
    ageTier: AgeTier;
    bibleVersionId: string;
    verseFrom: number;
    verseTo: number;
  }): Promise<PassageAdaptation[]>;
  updateStatus(id: string, status: AdaptationStatus): Promise<PassageAdaptation>;
  updateVotes(id: string, voteScore: number, voteCount: number): Promise<PassageAdaptation>;
}
