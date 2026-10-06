import { createHash } from 'node:crypto';
import type { PassageAdaptation, PrismaClient } from '@prisma/client';
import type { AdaptationLookupKey } from '@/lib/repositories/interfaces/adaptation.repository';

export const MAX_CACHED_VIEWS_PER_REQUEST = 3;

export type AdaptationViewSource = 'cached' | 'generated';

export function buildAdaptationCacheKey(key: AdaptationLookupKey): string {
  return createHash('sha256')
    .update(
      [
        key.passageId,
        key.bibleVersionId,
        String(key.verseFrom),
        String(key.verseTo),
        key.ageTier,
        key.languageStyle,
        key.contentType,
      ].join('|')
    )
    .digest('hex');
}

export class StoryCacheService {
  constructor(private readonly prisma: PrismaClient) {}

  async countCachedViewsShown(
    userId: string,
    childProfileId: string | undefined,
    cacheKey: string
  ): Promise<number> {
    return this.prisma.adaptationView.count({
      where: {
        userId,
        childProfileId: childProfileId ?? null,
        cacheKey,
        source: 'cached',
      },
    });
  }

  async getSeenAdaptationIds(
    userId: string,
    childProfileId: string | undefined,
    cacheKey: string
  ): Promise<string[]> {
    const views = await this.prisma.adaptationView.findMany({
      where: {
        userId,
        childProfileId: childProfileId ?? null,
        cacheKey,
      },
      select: { adaptationId: true },
    });
    return views.map((view) => view.adaptationId);
  }

  shouldTryCachedView(cachedViewsShown: number): boolean {
    return cachedViewsShown < MAX_CACHED_VIEWS_PER_REQUEST;
  }

  async pickRandomUnseenCachedAdaptation(params: {
    lookupKey: AdaptationLookupKey;
    cacheKey: string;
    userId: string;
    childProfileId?: string;
    excludeAdaptationIds?: string[];
  }): Promise<PassageAdaptation | null> {
    const seenIds = await this.getSeenAdaptationIds(
      params.userId,
      params.childProfileId,
      params.cacheKey
    );
    const exclude = new Set([...seenIds, ...(params.excludeAdaptationIds ?? [])]);

    const candidates = await this.prisma.passageAdaptation.findMany({
      where: {
        passageId: params.lookupKey.passageId,
        bibleVersionId: params.lookupKey.bibleVersionId,
        verseFrom: params.lookupKey.verseFrom,
        verseTo: params.lookupKey.verseTo,
        ageTier: params.lookupKey.ageTier,
        languageStyle: params.lookupKey.languageStyle,
        contentType: params.lookupKey.contentType,
        AND: [
          {
            OR: [
              { createdByUserId: { not: params.userId } },
              { createdByUserId: null },
            ],
          },
          ...(exclude.size > 0 ? [{ id: { notIn: Array.from(exclude) } }] : []),
        ],
      },
    });

    if (candidates.length === 0) return null;

    const index = Math.floor(Math.random() * candidates.length);
    return candidates[index] ?? null;
  }

  async recordView(params: {
    userId: string;
    childProfileId?: string;
    adaptationId: string;
    cacheKey: string;
    source: AdaptationViewSource;
  }): Promise<void> {
    const childProfileId = params.childProfileId ?? null;
    const existing = await this.prisma.adaptationView.findFirst({
      where: {
        userId: params.userId,
        childProfileId,
        adaptationId: params.adaptationId,
      },
    });

    if (existing) {
      await this.prisma.adaptationView.update({
        where: { id: existing.id },
        data: {
          viewedAt: new Date(),
          source: params.source,
          cacheKey: params.cacheKey,
        },
      });
      return;
    }

    await this.prisma.adaptationView.create({
      data: {
        userId: params.userId,
        childProfileId,
        adaptationId: params.adaptationId,
        cacheKey: params.cacheKey,
        source: params.source,
      },
    });
  }

  async getNextVersionNumber(lookupKey: AdaptationLookupKey): Promise<number> {
    const aggregate = await this.prisma.passageAdaptation.aggregate({
      where: {
        passageId: lookupKey.passageId,
        bibleVersionId: lookupKey.bibleVersionId,
        verseFrom: lookupKey.verseFrom,
        verseTo: lookupKey.verseTo,
        ageTier: lookupKey.ageTier,
        languageStyle: lookupKey.languageStyle,
        contentType: lookupKey.contentType,
      },
      _max: { version: true },
    });

    return (aggregate._max.version ?? 0) + 1;
  }
}
