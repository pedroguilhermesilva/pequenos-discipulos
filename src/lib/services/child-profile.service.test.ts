import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainError } from '@/lib/domain/errors';
import { ChildProfileService } from '@/lib/services/child-profile.service';
import type { ChildProfileRepository } from '@/lib/repositories/interfaces/child-profile.repository';
import type { PlanLimitsService } from '@/lib/services/plan-limits.service';

describe('ChildProfileService', () => {
  const childProfiles: ChildProfileRepository = {
    findById: vi.fn(),
    listByUser: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    countByUser: vi.fn(),
  };

  const planLimits = {
    assertCanCreateProfile: vi.fn(),
  } as unknown as PlanLimitsService;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('delete', () => {
    it('deletes a profile owned by the user', async () => {
      vi.mocked(childProfiles.findById).mockResolvedValue({
        id: 'child-2',
        userId: 'user-1',
        name: 'Maria',
        avatarColor: 'vida',
        preferences: {},
        hasCreatedStory: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(childProfiles.countByUser).mockResolvedValue(2);

      const service = new ChildProfileService(childProfiles, planLimits);
      await service.delete('user-1', 'child-2');

      expect(childProfiles.delete).toHaveBeenCalledWith('child-2');
    });

    it('rejects deleting a profile that does not belong to the user', async () => {
      vi.mocked(childProfiles.findById).mockResolvedValue({
        id: 'child-2',
        userId: 'other-user',
        name: 'Maria',
        avatarColor: 'vida',
        preferences: {},
        hasCreatedStory: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const service = new ChildProfileService(childProfiles, planLimits);
      await expect(service.delete('user-1', 'child-2')).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
      expect(childProfiles.delete).not.toHaveBeenCalled();
    });

    it('rejects deleting the only remaining profile', async () => {
      vi.mocked(childProfiles.findById).mockResolvedValue({
        id: 'child-1',
        userId: 'user-1',
        name: 'Davi',
        avatarColor: 'laranja',
        preferences: {},
        hasCreatedStory: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(childProfiles.countByUser).mockResolvedValue(1);

      const service = new ChildProfileService(childProfiles, planLimits);
      await expect(service.delete('user-1', 'child-1')).rejects.toBeInstanceOf(DomainError);
      expect(childProfiles.delete).not.toHaveBeenCalled();
    });
  });
});
