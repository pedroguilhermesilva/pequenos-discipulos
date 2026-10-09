import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdaptationNotFound, UnauthorizedError } from '@/lib/domain/errors';
import { LibraryService } from '@/lib/services/library.service';

describe('LibraryService', () => {
  const adaptations = {
    findById: vi.fn(),
    listApproved: vi.fn(),
  };
  const userStories = {
    listByUser: vi.fn(),
    findById: vi.fn(),
    upsertFromAdaptation: vi.fn(),
    upsertProgress: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function buildService() {
    return new LibraryService(adaptations as never, userStories as never);
  }

  describe('adoptCommunityAdaptation', () => {
    it('links a community adaptation to the child library', async () => {
      vi.mocked(adaptations.findById).mockResolvedValue({
        id: 'adapt-1',
        status: 'community',
        content: { pages: [{}, {}, {}] },
      } as never);
      vi.mocked(userStories.upsertFromAdaptation).mockResolvedValue({ id: 'story-1' } as never);
      vi.mocked(userStories.upsertProgress).mockResolvedValue({} as never);

      const result = await buildService().adoptCommunityAdaptation('user-a', 'adapt-1', 'child-1');

      expect(result.userStoryId).toBe('story-1');
      expect(userStories.upsertFromAdaptation).toHaveBeenCalledWith({
        userId: 'user-a',
        childProfileId: 'child-1',
        adaptationId: 'adapt-1',
      });
      expect(userStories.upsertProgress).toHaveBeenCalledWith('story-1', 1, 3);
    });

    it('rejects draft adaptations from other families', async () => {
      vi.mocked(adaptations.findById).mockResolvedValue({
        id: 'adapt-1',
        status: 'draft',
        content: { pages: [] },
      } as never);

      await expect(
        buildService().adoptCommunityAdaptation('user-a', 'adapt-1', 'child-1')
      ).rejects.toBeInstanceOf(UnauthorizedError);
      expect(userStories.upsertFromAdaptation).not.toHaveBeenCalled();
    });

    it('throws when adaptation is missing', async () => {
      vi.mocked(adaptations.findById).mockResolvedValue(null);

      await expect(
        buildService().adoptCommunityAdaptation('user-a', 'missing', 'child-1')
      ).rejects.toBeInstanceOf(AdaptationNotFound);
    });
  });
});
