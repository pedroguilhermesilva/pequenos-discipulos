import { fromPrismaContentType } from '@/lib/domain/mappers';
import type { UserStoryRepository } from '@/lib/repositories/interfaces/user-story.repository';
import type { FavoriteItem } from '@/lib/stories/types';

export class FavoritesService {
  constructor(private readonly userStories: UserStoryRepository) {}

  async list(userId: string, childProfileId?: string): Promise<FavoriteItem[]> {
    const rows = await this.userStories.findFavorites(userId, childProfileId);

    return rows.map((story) => ({
      id: story.id,
      title: story.adaptation.title,
      contentType: fromPrismaContentType(story.adaptation.contentType),
      originalReference: story.adaptation.passage.reference,
      imageUrl: story.adaptation.imageUrl,
      readingGoal: null,
      languageStyle: story.adaptation.languageStyle,
      savedAt: story.updatedAt.toISOString(),
    }));
  }

  async setFavorite(userStoryId: string, isFavorite: boolean) {
    return this.userStories.setFavorite(userStoryId, isFavorite);
  }
}
