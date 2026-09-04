import type { PassageAdaptation, ReadingProgress, UserStory } from '@prisma/client';
import type { BibleVerseLine } from '@/lib/stories/bible-passages';

export type UserStoryWithRelations = UserStory & {
  adaptation: PassageAdaptation & {
    passage: {
      slug: string;
      reference: string;
      book: string;
      preview: string;
      sourceText: unknown;
    };
  };
  progress: ReadingProgress | null;
};

export type UserStoryDetail = {
  summary: import('@/lib/stories').StorySummary;
  adaptationId: string;
  passageSlug: string;
  verseFrom: number;
  verseTo: number;
  sourceVerses: BibleVerseLine[];
};

export type UpsertUserStoryInput = {
  userId: string;
  childProfileId?: string | null;
  adaptationId: string;
  isFavorite?: boolean;
};

export interface UserStoryRepository {
  findById(id: string): Promise<UserStoryWithRelations | null>;
  findFavorites(userId: string, childProfileId?: string): Promise<UserStoryWithRelations[]>;
  listByUser(userId: string, childProfileId?: string): Promise<UserStoryWithRelations[]>;
  findByUserAndAdaptation(
    userId: string,
    adaptationId: string,
    childProfileId?: string | null
  ): Promise<UserStory | null>;
  upsertFromAdaptation(input: UpsertUserStoryInput): Promise<UserStory>;
  setFavorite(id: string, isFavorite: boolean): Promise<UserStory>;
  upsertProgress(userStoryId: string, currentPage: number, totalPages: number): Promise<ReadingProgress>;
}
