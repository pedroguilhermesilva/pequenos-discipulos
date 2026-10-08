import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FRIENDLY_GENERATION_ERROR } from '@/lib/domain/errors';
import { StoryGenerationService } from '@/lib/services/story-generation.service';

describe('StoryGenerationService cache-first behavior', () => {
  const adaptations = { findByCacheKey: vi.fn() };
  const userStories = { upsertFromAdaptation: vi.fn() };
  const childProfiles = { update: vi.fn() };
  const planLimits = { assertCanGenerate: vi.fn() };
  const llm = { generateStory: vi.fn() };
  const audio = { prepareAdaptationAudio: vi.fn() };
  const storyCache = {
    countCachedViewsShown: vi.fn(),
    shouldTryCachedView: vi.fn(),
    pickHighestScoredUnseenCachedAdaptation: vi.fn(),
    recordView: vi.fn(),
    getNextVersionNumber: vi.fn(),
  };
  const prisma = {
    passage: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    passageAdaptation: { create: vi.fn(), findUnique: vi.fn() },
    readingProgress: { upsert: vi.fn() },
    usageEvent: { upsert: vi.fn() },
    storyGenerationIdempotency: {
      findUnique: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(audio.prepareAdaptationAudio).mockResolvedValue(undefined);
    vi.mocked(prisma.passage.findUnique).mockResolvedValue({ id: 'passage-1' } as never);
    vi.mocked(userStories.upsertFromAdaptation).mockResolvedValue({ id: 'user-story-1' } as never);
    vi.mocked(storyCache.countCachedViewsShown).mockResolvedValue(0);
    vi.mocked(storyCache.shouldTryCachedView).mockReturnValue(true);
    vi.mocked(prisma.storyGenerationIdempotency.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.storyGenerationIdempotency.create).mockResolvedValue({} as never);
    vi.mocked(prisma.storyGenerationIdempotency.updateMany).mockResolvedValue({ count: 1 } as never);
    vi.mocked(prisma.storyGenerationIdempotency.deleteMany).mockResolvedValue({ count: 1 } as never);
    vi.mocked(prisma.passageAdaptation.findUnique).mockResolvedValue(null);
  });

  function buildService() {
    return new StoryGenerationService(
      prisma as never,
      adaptations as never,
      userStories as never,
      {} as never,
      childProfiles as never,
      planLimits as never,
      llm as never,
      audio as never,
      storyCache as never
    );
  }

  const sampleContent = { pages: [{ paragraphs: [[{ type: 'text', value: 'Olá' }]] }] };

  const payload = {
    passageSlug: 'mateus-2-1-3',
    bibleVersionId: 'alm1911',
    verseFrom: 1,
    verseTo: 3,
    ageTier: '3-5' as const,
    languageStyle: 'rhymes' as const,
    contentType: 'text' as const,
    childProfileId: 'child-1',
  };

  it('serves a cached adaptation from another user without calling the LLM', async () => {
    vi.mocked(storyCache.pickHighestScoredUnseenCachedAdaptation).mockResolvedValue({
      id: 'adaptation-cached',
      title: 'História em cache',
      content: sampleContent,
    } as never);

    const result = await buildService().generateOrReuse({
      userId: 'user-a',
      tier: 'free',
      payload,
    });

    expect(result.adaptationId).toBe('adaptation-cached');
    expect(result.content).toEqual(sampleContent);
    expect(llm.generateStory).not.toHaveBeenCalled();
    expect(planLimits.assertCanGenerate).not.toHaveBeenCalled();
    expect(storyCache.recordView).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'cached', adaptationId: 'adaptation-cached' })
    );
  });

  it('generates with LLM using only the biblical reference when no cache is available', async () => {
    vi.mocked(storyCache.pickHighestScoredUnseenCachedAdaptation).mockResolvedValue(null);
    vi.mocked(planLimits.assertCanGenerate).mockResolvedValue(undefined);
    vi.mocked(llm.generateStory).mockResolvedValue({
      title: 'Nova história',
      content: { pages: [{ paragraphs: [[{ type: 'text', value: 'Olá' }]] }] },
      adaptationNote: 'Nota',
    });
    vi.mocked(storyCache.getNextVersionNumber).mockResolvedValue(2);
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) =>
      fn({
        passageAdaptation: { create: vi.fn().mockResolvedValue({ id: 'adapt-new', title: 'Nova história' }) },
        usageEvent: { upsert: vi.fn() },
        childProfile: { update: vi.fn() },
      } as never)
    );

    const result = await buildService().generateOrReuse({
      userId: 'user-a',
      tier: 'free',
      payload,
    });

    expect(result.adaptationId).toBe('adapt-new');
    expect(llm.generateStory).toHaveBeenCalledWith(
      expect.objectContaining({
        reference: expect.stringMatching(/Mateus/i),
      })
    );
    expect(llm.generateStory).toHaveBeenCalledOnce();
    expect(planLimits.assertCanGenerate).toHaveBeenCalledOnce();

    const llmPayload = vi.mocked(llm.generateStory).mock.calls[0]?.[0];
    expect(JSON.stringify(llmPayload)).not.toMatch(/child-1|Davi|Maria|João/i);
    expect(llmPayload).not.toHaveProperty('childName');
    expect(llmPayload).not.toHaveProperty('childProfileId');
  });

  it('serves another user approved community version from cache before calling the LLM', async () => {
    vi.mocked(storyCache.pickHighestScoredUnseenCachedAdaptation).mockResolvedValue({
      id: 'adaptation-from-user-b',
      title: 'Versão aprovada do utilizador B',
      content: sampleContent,
      status: 'community',
    } as never);

    const result = await buildService().generateOrReuse({
      userId: 'user-a',
      tier: 'free',
      payload,
    });

    expect(result.adaptationId).toBe('adaptation-from-user-b');
    expect(llm.generateStory).not.toHaveBeenCalled();
    expect(storyCache.pickHighestScoredUnseenCachedAdaptation).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-a' })
    );
  });

  it('does not reuse draft when cache finds no approved version', async () => {
    vi.mocked(storyCache.pickHighestScoredUnseenCachedAdaptation).mockResolvedValue(null);

    await buildService().generateOrReuse({
      userId: 'user-a',
      tier: 'free',
      payload,
    });

    expect(llm.generateStory).toHaveBeenCalled();
  });

  it('returns the same result for duplicate requests with the same idempotency key', async () => {
    vi.mocked(prisma.storyGenerationIdempotency.findUnique).mockResolvedValue({
      adaptationId: 'adaptation-cached',
      userStoryId: 'user-story-1',
      title: 'História em cache',
      expiresAt: new Date(Date.now() + 60_000),
    } as never);
    vi.mocked(prisma.passageAdaptation.findUnique).mockResolvedValue({
      id: 'adaptation-cached',
      title: 'História em cache',
      content: sampleContent,
      quiz: null,
      adaptationNote: null,
    } as never);

    const result = await buildService().generateOrReuse({
      userId: 'user-a',
      tier: 'free',
      payload: { ...payload, idempotencyKey: 'req-1' },
    });

    expect(result.adaptationId).toBe('adaptation-cached');
    expect(llm.generateStory).not.toHaveBeenCalled();
    expect(prisma.storyGenerationIdempotency.create).not.toHaveBeenCalled();
  });

  it('skips cache lookup after three cached views and generates anew', async () => {
    vi.mocked(storyCache.countCachedViewsShown).mockResolvedValue(3);
    vi.mocked(storyCache.shouldTryCachedView).mockReturnValue(false);
    vi.mocked(planLimits.assertCanGenerate).mockResolvedValue(undefined);
    vi.mocked(llm.generateStory).mockResolvedValue({
      title: 'Quarta versão',
      content: { pages: [{ paragraphs: [[{ type: 'text', value: 'Olá' }]] }] },
    });
    vi.mocked(storyCache.getNextVersionNumber).mockResolvedValue(4);
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) =>
      fn({
        passageAdaptation: { create: vi.fn().mockResolvedValue({ id: 'adapt-4', title: 'Quarta versão' }) },
        usageEvent: { upsert: vi.fn() },
        childProfile: { update: vi.fn() },
      } as never)
    );

    await buildService().generateOrReuse({
      userId: 'user-a',
      tier: 'free',
      payload: { ...payload, mode: 'regenerate', currentAdaptationId: 'adapt-3' },
    });

    expect(storyCache.pickHighestScoredUnseenCachedAdaptation).not.toHaveBeenCalled();
    expect(llm.generateStory).toHaveBeenCalledOnce();
  });

  it('stores a chapter-level Passage reference (the verse range lives on the adaptation)', async () => {
    vi.mocked(prisma.passage.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.passage.create).mockResolvedValue({ id: 'passage-new' } as never);
    vi.mocked(storyCache.pickHighestScoredUnseenCachedAdaptation).mockResolvedValue({
      id: 'adaptation-cached',
      title: 'História em cache',
      content: sampleContent,
    } as never);

    await buildService().generateOrReuse({
      userId: 'user-a',
      tier: 'free',
      payload: { ...payload, verseFrom: 1, verseTo: 10 },
    });

    const createArgs = vi.mocked(prisma.passage.create).mock.calls[0]?.[0] as {
      data: { reference: string; sourceText: { reference: string } };
    };
    expect(createArgs.data.reference).toBe('Mateus 2');
    expect(createArgs.data.sourceText.reference).toBe('Mateus 2');
  });

  it('wraps unexpected LLM content-shape failures in a friendly LlmValidationError', async () => {
    vi.mocked(storyCache.pickHighestScoredUnseenCachedAdaptation).mockResolvedValue(null);
    vi.mocked(planLimits.assertCanGenerate).mockResolvedValue(undefined);
    vi.mocked(llm.generateStory).mockResolvedValue({ title: 'x', content: { pages: [] } } as never);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const error = await buildService()
      .generateOrReuse({ userId: 'user-a', tier: 'free', payload })
      .catch((e: unknown) => e as Error);

    expect((error as Error).message).toBe(FRIENDLY_GENERATION_ERROR);
    errorSpy.mockRestore();
  });

  it('releases its pending idempotency claim when generation fails, so "Tentar novamente" is not blocked', async () => {
    vi.mocked(storyCache.pickHighestScoredUnseenCachedAdaptation).mockResolvedValue(null);
    vi.mocked(planLimits.assertCanGenerate).mockResolvedValue(undefined);
    vi.mocked(llm.generateStory).mockRejectedValue(new Error('LLM down'));

    await expect(
      buildService().generateOrReuse({
        userId: 'user-a',
        tier: 'free',
        payload: { ...payload, idempotencyKey: 'req-fail' },
      })
    ).rejects.toThrow('LLM down');

    expect(prisma.storyGenerationIdempotency.create).toHaveBeenCalledOnce();
    expect(prisma.storyGenerationIdempotency.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-a', idempotencyKey: 'req-fail', title: '__pending__' },
    });
  });

  it('does not release a claim it does not own (another request is still generating)', async () => {
    const { Prisma } = await import('@prisma/client');
    vi.mocked(prisma.storyGenerationIdempotency.create).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'test' })
    );
    vi.useFakeTimers();
    vi.mocked(storyCache.pickHighestScoredUnseenCachedAdaptation).mockResolvedValue(null);
    vi.mocked(planLimits.assertCanGenerate).mockResolvedValue(undefined);
    vi.mocked(llm.generateStory).mockRejectedValue(new Error('LLM down'));

    const pending = buildService()
      .generateOrReuse({
        userId: 'user-a',
        tier: 'free',
        payload: { ...payload, idempotencyKey: 'req-other' },
      })
      .catch((e: unknown) => e as Error);
    await vi.advanceTimersByTimeAsync(130_000);
    const error = await pending;
    vi.useRealTimers();

    expect((error as Error).message).toBe('LLM down');
    expect(prisma.storyGenerationIdempotency.deleteMany).not.toHaveBeenCalled();
  });
});
