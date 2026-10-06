import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildAdaptationCacheKey,
  MAX_CACHED_VIEWS_PER_REQUEST,
  StoryCacheService,
} from '@/lib/services/story-cache.service';

describe('StoryCacheService', () => {
  const prisma = {
    adaptationView: {
      count: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    passageAdaptation: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds a stable cache key hash', () => {
    const key = buildAdaptationCacheKey({
      passageId: 'passage-1',
      bibleVersionId: 'alm1911',
      verseFrom: 1,
      verseTo: 3,
      ageTier: 'TIER_3_5',
      languageStyle: 'rhymes',
      contentType: 'text',
    });

    expect(key).toHaveLength(64);
    expect(buildAdaptationCacheKey({
      passageId: 'passage-1',
      bibleVersionId: 'alm1911',
      verseFrom: 1,
      verseTo: 3,
      ageTier: 'TIER_3_5',
      languageStyle: 'rhymes',
      contentType: 'text',
    })).toBe(key);
  });

  it('allows cached views until the limit of three', () => {
    const service = new StoryCacheService(prisma as never);
    expect(service.shouldTryCachedView(0)).toBe(true);
    expect(service.shouldTryCachedView(2)).toBe(true);
    expect(service.shouldTryCachedView(MAX_CACHED_VIEWS_PER_REQUEST - 1)).toBe(true);
    expect(service.shouldTryCachedView(MAX_CACHED_VIEWS_PER_REQUEST)).toBe(false);
  });

  it('excludes own adaptations and already seen ids when picking cache', async () => {
    vi.mocked(prisma.adaptationView.findMany).mockResolvedValue([
      { adaptationId: 'seen-1' },
    ] as never);
    vi.mocked(prisma.passageAdaptation.findMany).mockResolvedValue([
      { id: 'candidate-1', title: 'Cached A' },
    ] as never);

    const service = new StoryCacheService(prisma as never);
    const lookupKey = {
      passageId: 'passage-1',
      bibleVersionId: 'alm1911',
      verseFrom: 1,
      verseTo: 3,
      ageTier: 'TIER_3_5' as const,
      languageStyle: 'rhymes',
      contentType: 'text' as const,
    };

    const picked = await service.pickRandomUnseenCachedAdaptation({
      lookupKey,
      cacheKey: buildAdaptationCacheKey(lookupKey),
      userId: 'user-a',
      childProfileId: 'child-1',
      excludeAdaptationIds: ['current-1'],
    });

    expect(picked?.id).toBe('candidate-1');
    expect(prisma.passageAdaptation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              OR: expect.arrayContaining([
                { createdByUserId: { not: 'user-a' } },
                { createdByUserId: null },
              ]),
            }),
            { id: { notIn: expect.arrayContaining(['seen-1', 'current-1']) } },
          ]),
        }),
      })
    );
  });
});
