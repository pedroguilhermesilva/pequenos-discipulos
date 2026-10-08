import { createHash } from 'node:crypto';
import type { PassageAdaptation, PrismaClient } from '@prisma/client';
import { CACHEABLE_STATUSES } from '@/lib/moderation/constants';
import type { AdaptationLookupKey } from '@/lib/repositories/interfaces/adaptation.repository';
import {
  getBibleVersionIdVariants,
  resolveBibleVersionId,
} from '@/lib/stories/bible-versions';

export const MAX_CACHED_VIEWS_PER_REQUEST = 3;

export type AdaptationViewSource = 'cached' | 'generated';

export function buildAdaptationCacheKey(key: AdaptationLookupKey): string {
  const bibleVersionId = resolveBibleVersionId(key.bibleVersionId);
  return createHash('sha256')
    .update(
      [
        key.passageId,
        bibleVersionId,
        String(key.verseFrom),
        String(key.verseTo),
        key.ageTier,
        key.languageStyle,
        key.contentType,
      ].join('|')
    )
    .digest('hex');
}

/** Pick one item at random from a list (tiebreaker). */
export function pickRandom<T>(items: readonly T[]): T | null {
  if (items.length === 0) return null;
  const index = Math.floor(Math.random() * items.length);
  return items[index] ?? null;
}

/** Among equally scored candidates, pick one at random. */
export function pickHighestScoredAdaptation(
  candidates: PassageAdaptation[]
): PassageAdaptation | null {
  if (candidates.length === 0) return null;

  const sorted = [...candidates].sort((a, b) => {
    if (b.voteScore !== a.voteScore) return b.voteScore - a.voteScore;
    if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
    return 0;
  });

  const topScore = sorted[0]?.voteScore ?? 0;
  const topCandidates = sorted.filter((c) => c.voteScore === topScore);
  return pickRandom(topCandidates);
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

  async pickHighestScoredUnseenCachedAdaptation(params: {
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

    const bibleVersionIds = getBibleVersionIdVariants(params.lookupKey.bibleVersionId);
    const candidates = await this.prisma.passageAdaptation.findMany({
      where: {
        passageId: params.lookupKey.passageId,
        bibleVersionId: { in: bibleVersionIds },
        verseFrom: params.lookupKey.verseFrom,
        verseTo: params.lookupKey.verseTo,
        ageTier: params.lookupKey.ageTier,
        languageStyle: params.lookupKey.languageStyle,
        contentType: params.lookupKey.contentType,
        status: { in: CACHEABLE_STATUSES },
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
      orderBy: [{ voteScore: 'desc' }, { voteCount: 'desc' }],
    });

    return pickHighestScoredAdaptation(candidates);
  }

  /** @deprecated Use pickHighestScoredUnseenCachedAdaptation */
  async pickRandomUnseenCachedAdaptation(params: {
    lookupKey: AdaptationLookupKey;
    cacheKey: string;
    userId: string;
    childProfileId?: string;
    excludeAdaptationIds?: string[];
  }): Promise<PassageAdaptation | null> {
    return this.pickHighestScoredUnseenCachedAdaptation(params);
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
    const bibleVersionIds = getBibleVersionIdVariants(lookupKey.bibleVersionId);
    const aggregate = await this.prisma.passageAdaptation.aggregate({
      where: {
        passageId: lookupKey.passageId,
        bibleVersionId: { in: bibleVersionIds },
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
