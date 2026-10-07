import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserDataService } from '@/lib/services/user-data.service';
import { CURRENT_CONSENT_VERSION } from '@/lib/privacy/constants';

describe('UserDataService', () => {
  const storage = {
    delete: vi.fn(),
  };

  const prisma = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    childProfile: { findMany: vi.fn() },
    userStory: { findMany: vi.fn(), count: vi.fn() },
    adaptationView: { findMany: vi.fn() },
    adaptationVote: { findMany: vi.fn() },
    collection: { findMany: vi.fn() },
    usageEvent: { findMany: vi.fn() },
    passageAdaptation: { findMany: vi.fn(), updateMany: vi.fn() },
    audioAsset: { findMany: vi.fn(), deleteMany: vi.fn() },
    $transaction: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => fn(prisma));
  });

  function buildService() {
    return new UserDataService(prisma as never, storage as never);
  }

  describe('recordConsent', () => {
    it('stores consent version and timestamp for the user', async () => {
      vi.mocked(prisma.user.update).mockResolvedValue({} as never);

      await buildService().recordConsent('user-1', CURRENT_CONSENT_VERSION);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          consentVersion: CURRENT_CONSENT_VERSION,
          consentAcceptedAt: expect.any(Date),
        },
      });
    });

    it('rejects outdated consent versions', async () => {
      await expect(
        buildService().recordConsent('user-1', '2020-01-01')
      ).rejects.toThrow(/versão/i);
    });
  });

  describe('exportUserData', () => {
    it('returns only data belonging to the requesting user', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'pai@example.com',
        fullName: 'Pai',
        consentAcceptedAt: new Date('2026-10-07'),
        consentVersion: CURRENT_CONSENT_VERSION,
        subscriptionTier: 'free',
        createdAt: new Date('2026-01-01'),
      } as never);
      vi.mocked(prisma.childProfile.findMany).mockResolvedValue([
        { id: 'child-1', name: 'Davi', avatarColor: '#fff', preferences: {}, hasCreatedStory: true },
      ] as never);
      vi.mocked(prisma.userStory.findMany).mockResolvedValue([
        {
          id: 'story-1',
          adaptationId: 'adapt-1',
          isFavorite: true,
          childProfileId: 'child-1',
          createdAt: new Date('2026-02-01'),
        },
      ] as never);
      vi.mocked(prisma.adaptationView.findMany).mockResolvedValue([
        {
          adaptationId: 'adapt-1',
          childProfileId: 'child-1',
          source: 'cached',
          viewedAt: new Date('2026-02-01'),
        },
      ] as never);
      vi.mocked(prisma.adaptationVote.findMany).mockResolvedValue([
        { adaptationId: 'adapt-1', value: 1, createdAt: new Date('2026-02-01') },
      ] as never);
      vi.mocked(prisma.collection.findMany).mockResolvedValue([]);
      vi.mocked(prisma.usageEvent.findMany).mockResolvedValue([]);

      const data = await buildService().exportUserData('user-1');

      expect(data.account.email).toBe('pai@example.com');
      expect(data.childProfiles).toHaveLength(1);
      expect(data.userStories).toHaveLength(1);
      expect(prisma.childProfile.findMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
      expect(prisma.userStory.findMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    });
  });

  describe('deleteAccount', () => {
    it('anonymizes community adaptations instead of deleting them', async () => {
      vi.mocked(prisma.passageAdaptation.findMany).mockResolvedValue([
        { id: 'adapt-1' },
        { id: 'adapt-2' },
      ] as never);
      vi.mocked(prisma.userStory.count).mockResolvedValue(0);
      vi.mocked(prisma.audioAsset.findMany).mockResolvedValue([]);
      vi.mocked(prisma.passageAdaptation.updateMany).mockResolvedValue({ count: 2 });
      vi.mocked(prisma.user.delete).mockResolvedValue({} as never);

      await buildService().deleteAccount('user-1');

      expect(prisma.passageAdaptation.updateMany).toHaveBeenCalledWith({
        where: { createdByUserId: 'user-1' },
        data: { createdByUserId: null },
      });
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    });

    it('deletes private blob audio used only by this user', async () => {
      vi.mocked(prisma.passageAdaptation.findMany).mockResolvedValue([
        { id: 'adapt-private' },
      ] as never);
      vi.mocked(prisma.userStory.count).mockImplementation(async ({ where }) => {
        if (where.adaptationId === 'adapt-private' && where.userId?.not === 'user-1') {
          return 0;
        }
        return 0;
      });
      vi.mocked(prisma.audioAsset.findMany).mockResolvedValue([
        { id: 'audio-1', filePath: 'audio/adapt-private/block-1.mp3' },
      ] as never);
      vi.mocked(prisma.passageAdaptation.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.audioAsset.deleteMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.user.delete).mockResolvedValue({} as never);
      vi.mocked(storage.delete).mockResolvedValue(undefined);

      await buildService().deleteAccount('user-1');

      expect(storage.delete).toHaveBeenCalledWith('audio/adapt-private/block-1.mp3');
      expect(prisma.audioAsset.deleteMany).toHaveBeenCalled();
    });

    it('keeps shared adaptation audio when other users have the story', async () => {
      vi.mocked(prisma.passageAdaptation.findMany).mockResolvedValue([
        { id: 'adapt-shared' },
      ] as never);
      vi.mocked(prisma.userStory.count).mockImplementation(async ({ where }) => {
        if (where.adaptationId === 'adapt-shared' && where.userId?.not === 'user-1') {
          return 2;
        }
        return 0;
      });
      vi.mocked(prisma.audioAsset.findMany).mockResolvedValue([
        { id: 'audio-1', filePath: 'audio/adapt-shared/block-1.mp3' },
      ] as never);
      vi.mocked(prisma.passageAdaptation.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.user.delete).mockResolvedValue({} as never);

      await buildService().deleteAccount('user-1');

      expect(storage.delete).not.toHaveBeenCalled();
      expect(prisma.audioAsset.deleteMany).not.toHaveBeenCalled();
    });
  });
});
