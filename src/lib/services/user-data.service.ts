import type { PrismaClient } from '@prisma/client';
import { DomainError } from '@/lib/domain/errors';
import { CURRENT_CONSENT_VERSION } from '@/lib/privacy/constants';
import type { StorageProvider } from '@/lib/providers/interfaces/storage.provider';

export type UserDataExport = {
  exportedAt: string;
  consentVersion: string;
  account: {
    email: string | null;
    fullName: string | null;
    subscriptionTier: string;
    consentAcceptedAt: string | null;
    consentVersion: string | null;
    createdAt: string;
  };
  childProfiles: Array<{
    id: string;
    name: string;
    avatarColor: string;
    preferences: unknown;
    hasCreatedStory: boolean;
  }>;
  userStories: Array<{
    id: string;
    adaptationId: string;
    childProfileId: string | null;
    isFavorite: boolean;
    createdAt: string;
  }>;
  adaptationViews: Array<{
    adaptationId: string;
    childProfileId: string | null;
    source: string;
    viewedAt: string;
  }>;
  votes: Array<{
    adaptationId: string;
    value: number;
    createdAt: string;
  }>;
  collections: Array<{
    id: string;
    title: string;
    childProfileId: string;
    isLocked: boolean;
    createdAt: string;
  }>;
  usageEvents: Array<{
    contentType: string;
    month: string;
    count: number;
  }>;
};

export class UserDataService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly storage: StorageProvider
  ) {}

  async recordConsent(userId: string, consentVersion: string): Promise<void> {
    if (consentVersion !== CURRENT_CONSENT_VERSION) {
      throw new DomainError(
        'VALIDATION_ERROR',
        'Versão de consentimento inválida ou desatualizada.'
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        consentVersion,
        consentAcceptedAt: new Date(),
      },
    });
  }

  hasValidConsent(user: { consentAcceptedAt: Date | null; consentVersion: string | null }): boolean {
    return (
      user.consentAcceptedAt != null && user.consentVersion === CURRENT_CONSENT_VERSION
    );
  }

  async exportUserData(userId: string): Promise<UserDataExport> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new DomainError('NOT_FOUND', 'Conta não encontrada.');
    }

    const [childProfiles, userStories, adaptationViews, votes, collections, usageEvents] =
      await Promise.all([
        this.prisma.childProfile.findMany({ where: { userId } }),
        this.prisma.userStory.findMany({ where: { userId } }),
        this.prisma.adaptationView.findMany({ where: { userId } }),
        this.prisma.adaptationVote.findMany({ where: { userId } }),
        this.prisma.collection.findMany({ where: { userId } }),
        this.prisma.usageEvent.findMany({ where: { userId } }),
      ]);

    return {
      exportedAt: new Date().toISOString(),
      consentVersion: CURRENT_CONSENT_VERSION,
      account: {
        email: user.email,
        fullName: user.fullName,
        subscriptionTier: user.subscriptionTier,
        consentAcceptedAt: user.consentAcceptedAt?.toISOString() ?? null,
        consentVersion: user.consentVersion,
        createdAt: user.createdAt.toISOString(),
      },
      childProfiles: childProfiles.map((p) => ({
        id: p.id,
        name: p.name,
        avatarColor: p.avatarColor,
        preferences: p.preferences,
        hasCreatedStory: p.hasCreatedStory,
      })),
      userStories: userStories.map((s) => ({
        id: s.id,
        adaptationId: s.adaptationId,
        childProfileId: s.childProfileId,
        isFavorite: s.isFavorite,
        createdAt: s.createdAt.toISOString(),
      })),
      adaptationViews: adaptationViews.map((v) => ({
        adaptationId: v.adaptationId,
        childProfileId: v.childProfileId,
        source: v.source,
        viewedAt: v.viewedAt.toISOString(),
      })),
      votes: votes.map((v) => ({
        adaptationId: v.adaptationId,
        value: v.value,
        createdAt: v.createdAt.toISOString(),
      })),
      collections: collections.map((c) => ({
        id: c.id,
        title: c.title,
        childProfileId: c.childProfileId,
        isLocked: c.isLocked,
        createdAt: c.createdAt.toISOString(),
      })),
      usageEvents: usageEvents.map((e) => ({
        contentType: e.contentType,
        month: e.month,
        count: e.count,
      })),
    };
  }

  async deleteAccount(userId: string): Promise<void> {
    const userAdaptations = await this.prisma.passageAdaptation.findMany({
      where: { createdByUserId: userId },
      select: { id: true },
    });

    const adaptationIds = userAdaptations.map((a) => a.id);

    for (const adaptationId of adaptationIds) {
      const otherUsersCount = await this.prisma.userStory.count({
        where: { adaptationId, userId: { not: userId } },
      });

      if (otherUsersCount === 0) {
        const assets = await this.prisma.audioAsset.findMany({
          where: { adaptationId },
        });

        for (const asset of assets) {
          try {
            await this.storage.delete(asset.filePath);
          } catch (error) {
            console.error('[UserData] Falha ao apagar áudio privado', asset.filePath, error);
          }
        }

        if (assets.length > 0) {
          await this.prisma.audioAsset.deleteMany({ where: { adaptationId } });
        }
      }
    }

    await this.prisma.passageAdaptation.updateMany({
      where: { createdByUserId: userId },
      data: { createdByUserId: null },
    });

    await this.prisma.user.delete({ where: { id: userId } });
  }
}
