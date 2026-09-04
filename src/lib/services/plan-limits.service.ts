import type { ContentType, SubscriptionTier } from '@prisma/client';
import { GenerationLimitExceeded, ProfileLimitExceeded } from '@/lib/domain/errors';
import type { ChildProfileRepository } from '@/lib/repositories/interfaces/child-profile.repository';
import type { UsageRepository } from '@/lib/repositories/interfaces/usage.repository';

const TIER_LIMITS: Record<SubscriptionTier, Record<ContentType, number | null>> = {
  free: { text: 10, audio: 3, video: 1 },
  premium: { text: 50, audio: 20, video: 10 },
  family: { text: null, audio: null, video: null },
};

const PROFILE_LIMITS: Record<SubscriptionTier, number | null> = {
  free: 1,
  premium: 3,
  family: null,
};

export function currentUsageMonth(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export class PlanLimitsService {
  constructor(
    private readonly usage: UsageRepository,
    private readonly childProfiles: ChildProfileRepository
  ) {}

  async assertCanGenerate(
    userId: string,
    tier: SubscriptionTier,
    contentType: ContentType
  ): Promise<void> {
    const limit = TIER_LIMITS[tier][contentType];
    if (limit === null) return;

    const month = currentUsageMonth();
    const usage = await this.usage.getMonthUsage(userId, month);
    if (usage[contentType] >= limit) {
      throw new GenerationLimitExceeded(
        `Limite de ${limit} gerações de ${contentType} neste mês.`
      );
    }
  }

  async assertCanCreateProfile(userId: string, tier: SubscriptionTier): Promise<void> {
    const limit = PROFILE_LIMITS[tier];
    if (limit === null) return;

    const count = await this.childProfiles.countByUser(userId);
    if (count >= limit) {
      throw new ProfileLimitExceeded(
        `O plano ${tier} permite até ${limit} perfil${limit === 1 ? '' : 'is'}.`
      );
    }
  }

  async getUsage(userId: string) {
    return this.usage.getMonthUsage(userId, currentUsageMonth());
  }

  getProfileLimit(tier: SubscriptionTier) {
    return PROFILE_LIMITS[tier];
  }

  getGenerationLimits(tier: SubscriptionTier) {
    return TIER_LIMITS[tier];
  }
}
