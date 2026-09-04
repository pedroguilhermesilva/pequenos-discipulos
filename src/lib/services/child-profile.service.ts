import type { Prisma } from '@prisma/client';
import { DomainError } from '@/lib/domain/errors';
import { userPreferencesSchema } from '@/lib/domain/schemas';
import type { ChildProfileRepository } from '@/lib/repositories/interfaces/child-profile.repository';
import type { UserPreferences } from '@/lib/onboarding/types';
import { PlanLimitsService } from '@/lib/services/plan-limits.service';
import type { ProfileAvatarColorId } from '@/lib/profiles/types';
import type { SubscriptionTier } from '@prisma/client';

export class ChildProfileService {
  constructor(
    private readonly childProfiles: ChildProfileRepository,
    private readonly planLimits: PlanLimitsService
  ) {}

  list(userId: string) {
    return this.childProfiles.listByUser(userId);
  }

  findById(id: string) {
    return this.childProfiles.findById(id);
  }

  async create(
    userId: string,
    tier: SubscriptionTier,
    input: {
      name: string;
      avatarColor: ProfileAvatarColorId;
      preferences: UserPreferences;
      id?: string;
    }
  ) {
    await this.planLimits.assertCanCreateProfile(userId, tier);
    const preferences = userPreferencesSchema.parse(input.preferences);

    return this.childProfiles.create({
      id: input.id,
      userId,
      name: input.name,
      avatarColor: input.avatarColor,
      preferences: preferences as Prisma.InputJsonValue,
    });
  }

  async updatePreferences(id: string, preferences: UserPreferences) {
    const parsed = userPreferencesSchema.parse(preferences);
    return this.childProfiles.update(id, {
      name: parsed.childName,
      preferences: parsed as Prisma.InputJsonValue,
    });
  }

  async markHasCreatedStory(id: string) {
    const profile = await this.childProfiles.findById(id);
    if (!profile) {
      throw new DomainError('NOT_FOUND', 'Perfil não encontrado.');
    }
    return this.childProfiles.update(id, { hasCreatedStory: true });
  }

  async migrateFromLocal(
    userId: string,
    tier: SubscriptionTier,
    profiles: Array<{
      id: string;
      name: string;
      avatarColor: ProfileAvatarColorId;
      preferences: UserPreferences;
      hasCreatedStory?: boolean;
    }>
  ) {
    const existing = await this.childProfiles.listByUser(userId);
    if (existing.length > 0) return existing;

    const created = [];
    for (const profile of profiles) {
      await this.planLimits.assertCanCreateProfile(userId, tier);
      created.push(
        await this.childProfiles.create({
          id: profile.id,
          userId,
          name: profile.name,
          avatarColor: profile.avatarColor,
          preferences: userPreferencesSchema.parse(profile.preferences) as Prisma.InputJsonValue,
          hasCreatedStory: profile.hasCreatedStory ?? false,
        })
      );
    }
    return created;
  }
}
