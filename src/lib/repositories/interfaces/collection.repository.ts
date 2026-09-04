import type { Collection, CollectionItem, UserStory } from '@prisma/client';

export type CollectionWithItems = Collection & {
  items: Array<
    CollectionItem & {
      userStory: UserStory & {
        adaptation: { id: string; title: string; imageUrl: string | null };
      };
    }
  >;
};

export interface CollectionRepository {
  listByChild(userId: string, childProfileId: string): Promise<CollectionWithItems[]>;
  create(input: {
    userId: string;
    childProfileId: string;
    title: string;
    isLocked?: boolean;
  }): Promise<Collection>;
  addItem(input: {
    collectionId: string;
    userStoryId: string;
    position: number;
  }): Promise<CollectionItem>;
}
