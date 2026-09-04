import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FavoritesService } from '@/lib/services/favorites.service';
import type { UserStoryRepository } from '@/lib/repositories/interfaces/user-story.repository';

describe('FavoritesService', () => {
  const userStories = {
    findFavorites: vi.fn(),
    setFavorite: vi.fn(),
  } as unknown as UserStoryRepository;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps user stories to favorite items', async () => {
    vi.mocked(userStories.findFavorites).mockResolvedValue([
      {
        id: 'story-1',
        userId: 'u1',
        childProfileId: 'c1',
        adaptationId: 'a1',
        isFavorite: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
        progress: null,
        adaptation: {
          id: 'a1',
          title: 'A Estrela',
          contentType: 'text',
          languageStyle: 'rhymes',
          imageUrl: null,
          passage: {
            slug: 'mateus-2-1-3',
            reference: 'Mateus 2:1–3',
            book: 'Mateus',
            preview: 'preview',
          },
        },
      } as never,
    ]);

    const service = new FavoritesService(userStories);
    const items = await service.list('u1', 'c1');

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: 'story-1',
      title: 'A Estrela',
      contentType: 'text',
      originalReference: 'Mateus 2:1–3',
    });
  });
});
