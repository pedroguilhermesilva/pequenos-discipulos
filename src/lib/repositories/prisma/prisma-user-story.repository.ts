import type { PrismaClient, ReadingProgress, UserStory } from '@prisma/client';
import type {
  UpsertUserStoryInput,
  UserStoryRepository,
  UserStoryWithRelations,
} from '@/lib/repositories/interfaces/user-story.repository';

const withRelations = {
  adaptation: {
    include: {
      passage: {
        select: { slug: true, reference: true, book: true, preview: true, sourceText: true },
      },
    },
  },
  progress: true,
} as const;

export class PrismaUserStoryRepository implements UserStoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string): Promise<UserStoryWithRelations | null> {
    return this.prisma.userStory.findUnique({
      where: { id },
      include: withRelations,
    }) as Promise<UserStoryWithRelations | null>;
  }

  findFavorites(userId: string, childProfileId?: string): Promise<UserStoryWithRelations[]> {
    return this.prisma.userStory.findMany({
      where: {
        userId,
        isFavorite: true,
        ...(childProfileId ? { childProfileId } : {}),
      },
      include: withRelations,
      orderBy: { updatedAt: 'desc' },
    }) as Promise<UserStoryWithRelations[]>;
  }

  listByUser(userId: string, childProfileId?: string): Promise<UserStoryWithRelations[]> {
    return this.prisma.userStory.findMany({
      where: {
        userId,
        ...(childProfileId ? { childProfileId } : {}),
      },
      include: withRelations,
      orderBy: { updatedAt: 'desc' },
    }) as Promise<UserStoryWithRelations[]>;
  }

  findByUserAndAdaptation(
    userId: string,
    adaptationId: string,
    childProfileId?: string | null
  ): Promise<UserStory | null> {
    return this.prisma.userStory.findFirst({
      where: {
        userId,
        adaptationId,
        ...(childProfileId ? { childProfileId } : {}),
      },
    });
  }

  async upsertFromAdaptation(input: UpsertUserStoryInput): Promise<UserStory> {
    const existing = await this.findByUserAndAdaptation(
      input.userId,
      input.adaptationId,
      input.childProfileId
    );

    if (existing) {
      return this.prisma.userStory.update({
        where: { id: existing.id },
        data: {
          isFavorite: input.isFavorite ?? existing.isFavorite,
          childProfileId: input.childProfileId ?? existing.childProfileId,
        },
      });
    }

    return this.prisma.userStory.create({
      data: {
        userId: input.userId,
        childProfileId: input.childProfileId ?? null,
        adaptationId: input.adaptationId,
        isFavorite: input.isFavorite ?? false,
      },
    });
  }

  setFavorite(id: string, isFavorite: boolean): Promise<UserStory> {
    return this.prisma.userStory.update({
      where: { id },
      data: { isFavorite },
    });
  }

  upsertProgress(
    userStoryId: string,
    currentPage: number,
    totalPages: number
  ): Promise<ReadingProgress> {
    return this.prisma.readingProgress.upsert({
      where: { userStoryId },
      update: { currentPage, totalPages },
      create: { userStoryId, currentPage, totalPages },
    });
  }
}
