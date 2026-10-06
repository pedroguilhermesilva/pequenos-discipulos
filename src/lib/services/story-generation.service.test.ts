import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StoryGenerationService } from '@/lib/services/story-generation.service';

describe('StoryGenerationService cache-first behavior', () => {
  const adaptations = { findByCacheKey: vi.fn() };
  const userStories = { upsertFromAdaptation: vi.fn() };
  const childProfiles = { update: vi.fn() };
  const planLimits = { assertCanGenerate: vi.fn() };
  const bibleText = { getPassageText: vi.fn() };
  const llm = { generateStory: vi.fn() };
  const audio = { prepareAdaptationAudio: vi.fn() };
  const storyCache = {
    countCachedViewsShown: vi.fn(),
    shouldTryCachedView: vi.fn(),
    pickRandomUnseenCachedAdaptation: vi.fn(),
    recordView: vi.fn(),
    getNextVersionNumber: vi.fn(),
  };
  const prisma = {
    passage: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    passageAdaptation: { create: vi.fn() },
    readingProgress: { upsert: vi.fn() },
    usageEvent: { upsert: vi.fn() },
    $transaction: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(audio.prepareAdaptationAudio).mockResolvedValue(undefined);
    vi.mocked(prisma.passage.findUnique).mockResolvedValue({ id: 'passage-1' } as never);
    vi.mocked(userStories.upsertFromAdaptation).mockResolvedValue({ id: 'user-story-1' } as never);
    vi.mocked(storyCache.countCachedViewsShown).mockResolvedValue(0);
    vi.mocked(storyCache.shouldTryCachedView).mockReturnValue(true);
  });

  function buildService() {
    return new StoryGenerationService(
      prisma as never,
      adaptations as never,
      userStories as never,
      {} as never,
      childProfiles as never,
      planLimits as never,
      bibleText as never,
      llm as never,
      audio as never,
      storyCache as never
    );
  }

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
    vi.mocked(storyCache.pickRandomUnseenCachedAdaptation).mockResolvedValue({
      id: 'adaptation-cached',
      title: 'História em cache',
    } as never);

    const result = await buildService().generateOrReuse({
      userId: 'user-a',
      tier: 'free',
      payload,
    });

    expect(result.adaptationId).toBe('adaptation-cached');
    expect(llm.generateStory).not.toHaveBeenCalled();
    expect(planLimits.assertCanGenerate).not.toHaveBeenCalled();
    expect(storyCache.recordView).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'cached', adaptationId: 'adaptation-cached' })
    );
  });

  it('generates with LLM when no cached adaptation is available', async () => {
    vi.mocked(storyCache.pickRandomUnseenCachedAdaptation).mockResolvedValue(null);
    vi.mocked(planLimits.assertCanGenerate).mockResolvedValue(undefined);
    vi.mocked(bibleText.getPassageText).mockResolvedValue({
      rawText: 'Texto bíblico',
      reference: 'Mateus 2:1-3',
      verses: [{ number: 1, text: 'Verso 1' }],
      bibleVersionId: 'alm1911',
    });
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
    expect(llm.generateStory).toHaveBeenCalledOnce();
    expect(planLimits.assertCanGenerate).toHaveBeenCalledOnce();
  });

  it('skips cache lookup after three cached views and generates anew', async () => {
    vi.mocked(storyCache.countCachedViewsShown).mockResolvedValue(3);
    vi.mocked(storyCache.shouldTryCachedView).mockReturnValue(false);
    vi.mocked(planLimits.assertCanGenerate).mockResolvedValue(undefined);
    vi.mocked(bibleText.getPassageText).mockResolvedValue({
      rawText: 'Texto',
      reference: 'Mateus 2:1-3',
      verses: [{ number: 1, text: 'Verso 1' }],
      bibleVersionId: 'alm1911',
    });
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

    expect(storyCache.pickRandomUnseenCachedAdaptation).not.toHaveBeenCalled();
    expect(llm.generateStory).toHaveBeenCalledOnce();
  });
});
