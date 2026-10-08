import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdaptationNotFound, UnauthorizedError } from '@/lib/domain/errors';
import { VoteService } from '@/lib/services/vote.service';

describe('VoteService', () => {
  const votes = {
    upsert: vi.fn(),
    aggregate: vi.fn(),
    findByUserAndAdaptation: vi.fn(),
  };
  const adaptations = {
    findById: vi.fn(),
    updateVotes: vi.fn(),
    updateStatus: vi.fn(),
    listCommunityVersions: vi.fn(),
  };
  const userStories = {
    findByUserAndAdaptation: vi.fn(),
  };
  const moderation = {
    submitForCommunityReview: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function buildService() {
    return new VoteService(
      votes as never,
      adaptations as never,
      userStories as never,
      moderation as never
    );
  }

  describe('approveWithFamily / shareWithCommunity (IDOR)', () => {
    it('allows family approve when user created the adaptation', async () => {
      vi.mocked(adaptations.findById).mockResolvedValue({
        id: 'adapt-1',
        createdByUserId: 'user-a',
      } as never);
      vi.mocked(adaptations.updateStatus).mockResolvedValue({ id: 'adapt-1' } as never);

      await buildService().approveWithFamily('user-a', 'adapt-1');

      expect(adaptations.updateStatus).toHaveBeenCalledWith('adapt-1', 'family_approved');
    });

    it('allows family approve when adaptation is linked via UserStory', async () => {
      vi.mocked(adaptations.findById).mockResolvedValue({
        id: 'adapt-1',
        createdByUserId: 'user-b',
      } as never);
      vi.mocked(userStories.findByUserAndAdaptation).mockResolvedValue({ id: 'story-1' } as never);
      vi.mocked(adaptations.updateStatus).mockResolvedValue({ id: 'adapt-1' } as never);

      await buildService().approveWithFamily('user-a', 'adapt-1');

      expect(adaptations.updateStatus).toHaveBeenCalledWith('adapt-1', 'family_approved');
    });

    it('rejects family approve for another user adaptation without UserStory link', async () => {
      vi.mocked(adaptations.findById).mockResolvedValue({
        id: 'adapt-1',
        createdByUserId: 'user-b',
      } as never);
      vi.mocked(userStories.findByUserAndAdaptation).mockResolvedValue(null);

      await expect(buildService().approveWithFamily('user-a', 'adapt-1')).rejects.toBeInstanceOf(
        UnauthorizedError
      );
      expect(adaptations.updateStatus).not.toHaveBeenCalled();
    });

    it('rejects shareWithCommunity for another user adaptation', async () => {
      vi.mocked(adaptations.findById).mockResolvedValue({
        id: 'adapt-1',
        createdByUserId: 'user-b',
      } as never);
      vi.mocked(userStories.findByUserAndAdaptation).mockResolvedValue(null);

      await expect(buildService().shareWithCommunity('user-a', 'adapt-1')).rejects.toBeInstanceOf(
        UnauthorizedError
      );
      expect(moderation.submitForCommunityReview).not.toHaveBeenCalled();
    });

    it('delegates shareWithCommunity to moderation review', async () => {
      vi.mocked(adaptations.findById).mockResolvedValue({
        id: 'adapt-1',
        createdByUserId: 'user-a',
      } as never);
      vi.mocked(moderation.submitForCommunityReview).mockResolvedValue({
        status: 'community',
        reason: null,
        verdict: 'approved',
      });

      const result = await buildService().shareWithCommunity('user-a', 'adapt-1');

      expect(moderation.submitForCommunityReview).toHaveBeenCalledWith('adapt-1', 'user-a');
      expect(result.status).toBe('community');
    });
  });

  describe('vote', () => {
    it('allows voting on community adaptations from other users', async () => {
      vi.mocked(adaptations.findById).mockResolvedValue({
        id: 'adapt-1',
        createdByUserId: 'user-b',
        status: 'community',
      } as never);
      vi.mocked(userStories.findByUserAndAdaptation).mockResolvedValue(null);
      vi.mocked(votes.aggregate).mockResolvedValue({ voteCount: 1, voteScore: 5 });
      vi.mocked(adaptations.updateVotes).mockResolvedValue({
        id: 'adapt-1',
        status: 'community',
      } as never);

      const result = await buildService().vote('user-a', 'adapt-1', 1);

      expect(votes.upsert).toHaveBeenCalledWith('user-a', 'adapt-1', 1);
      expect(result.voteCount).toBe(1);
    });

    it('rejects voting on own adaptation', async () => {
      vi.mocked(adaptations.findById).mockResolvedValue({
        id: 'adapt-1',
        createdByUserId: 'user-a',
        status: 'community',
      } as never);

      await expect(buildService().vote('user-a', 'adapt-1', 1)).rejects.toBeInstanceOf(
        UnauthorizedError
      );
      expect(votes.upsert).not.toHaveBeenCalled();
    });

    it('rejects voting on draft adaptations from other users', async () => {
      vi.mocked(adaptations.findById).mockResolvedValue({
        id: 'adapt-1',
        createdByUserId: 'user-b',
        status: 'draft',
      } as never);
      vi.mocked(userStories.findByUserAndAdaptation).mockResolvedValue(null);

      await expect(buildService().vote('user-a', 'adapt-1', 1)).rejects.toBeInstanceOf(
        UnauthorizedError
      );
      expect(votes.upsert).not.toHaveBeenCalled();
    });

    it('throws when adaptation is missing', async () => {
      vi.mocked(adaptations.findById).mockResolvedValue(null);

      await expect(buildService().vote('user-a', 'missing', 1)).rejects.toBeInstanceOf(
        AdaptationNotFound
      );
    });
  });
});
