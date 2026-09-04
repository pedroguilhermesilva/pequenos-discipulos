import type { Collection, CollectionItem, PrismaClient } from '@prisma/client';
import type {
  CollectionRepository,
  CollectionWithItems,
} from '@/lib/repositories/interfaces/collection.repository';

export class PrismaCollectionRepository implements CollectionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  listByChild(userId: string, childProfileId: string): Promise<CollectionWithItems[]> {
    return this.prisma.collection.findMany({
      where: { userId, childProfileId },
      include: {
        items: {
          orderBy: { position: 'asc' },
          include: {
            userStory: {
              include: {
                adaptation: {
                  select: { id: true, title: true, imageUrl: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    }) as Promise<CollectionWithItems[]>;
  }

  create(input: {
    userId: string;
    childProfileId: string;
    title: string;
    isLocked?: boolean;
  }): Promise<Collection> {
    return this.prisma.collection.create({
      data: {
        userId: input.userId,
        childProfileId: input.childProfileId,
        title: input.title,
        isLocked: input.isLocked ?? false,
      },
    });
  }

  addItem(input: {
    collectionId: string;
    userStoryId: string;
    position: number;
  }): Promise<CollectionItem> {
    return this.prisma.collectionItem.create({ data: input });
  }
}
