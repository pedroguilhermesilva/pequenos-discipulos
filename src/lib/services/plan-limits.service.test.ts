import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GenerationLimitExceeded } from '@/lib/domain/errors';
import { PlanLimitsService } from '@/lib/services/plan-limits.service';
import type { ChildProfileRepository } from '@/lib/repositories/interfaces/child-profile.repository';
import type { UsageRepository } from '@/lib/repositories/interfaces/usage.repository';

describe('PlanLimitsService', () => {
  const usage: UsageRepository = {
    getMonthUsage: vi.fn(),
    increment: vi.fn(),
  };
  const childProfiles: ChildProfileRepository = {
    findById: vi.fn(),
    listByUser: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    countByUser: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows generation under the free text limit', async () => {
    vi.mocked(usage.getMonthUsage).mockResolvedValue({ text: 2, audio: 0, video: 0 });
    const service = new PlanLimitsService(usage, childProfiles);
    await expect(service.assertCanGenerate('u1', 'free', 'text')).resolves.toBeUndefined();
  });

  it('blocks generation when monthly limit is reached', async () => {
    vi.mocked(usage.getMonthUsage).mockResolvedValue({ text: 10, audio: 0, video: 0 });
    const service = new PlanLimitsService(usage, childProfiles);
    await expect(service.assertCanGenerate('u1', 'free', 'text')).rejects.toBeInstanceOf(
      GenerationLimitExceeded
    );
  });

  it('blocks creating more profiles than the plan allows', async () => {
    vi.mocked(childProfiles.countByUser).mockResolvedValue(1);
    const service = new PlanLimitsService(usage, childProfiles);
    await expect(service.assertCanCreateProfile('u1', 'free')).rejects.toThrow(/perfil/);
  });
});
