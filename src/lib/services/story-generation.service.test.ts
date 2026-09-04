import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StoryGenerationService } from '@/lib/services/story-generation.service';

describe('StoryGenerationService cache behavior', () => {
  const adaptations = {
    findByCacheKey: vi.fn(),
    create: vi.fn(),
  };
  const userStories = {
    upsertFromAdaptation: vi.fn(),
  };
  const childProfiles = {
    update: vi.fn(),
  };
  const planLimits = {
    assertCanGenerate: vi.fn(),
  };
  const bibleText = {
    getPassageText: vi.fn(),
  };
  const llm = {
    generateStory: vi.fn(),
  };
  const audio = {
    prepareAdaptationAudio: vi.fn(),
  };
  const prisma = {
    passage: { findUnique: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(audio.prepareAdaptationAudio).mockResolvedValue(undefined);
  });

  it('reuses cached adaptation without calling LLM', async () => {
    vi.mocked(planLimits.assertCanGenerate).mockResolvedValue(undefined);
    vi.mocked(prisma.passage.findUnique).mockResolvedValue({ id: 'passage-1' } as never);
    vi.mocked(adaptations.findByCacheKey).mockResolvedValue({
      id: 'adaptation-1',
      title: 'Cached story',
    });
    vi.mocked(userStories.upsertFromAdaptation).mockResolvedValue({ id: 'user-story-1' });

    const service = new StoryGenerationService(
      prisma as never,
      adaptations as never,
      userStories as never,
      {} as never,
      childProfiles as never,
      planLimits as never,
      bibleText as never,
      llm as never,
      audio as never
    );

    const result = await service.generateOrReuse({
      userId: 'dev-user-1',
      tier: 'free',
      payload: {
        passageSlug: 'mateus-2-1-3',
        bibleVersionId: '211',
        verseFrom: 1,
        verseTo: 3,
        ageTier: '3-5',
        languageStyle: 'rhymes',
        contentType: 'text',
        childProfileId: 'dev-child-1',
      },
    });

    expect(result.fromCache).toBe(true);
    expect(result.adaptationId).toBe('adaptation-1');
    expect(llm.generateStory).not.toHaveBeenCalled();
    expect(bibleText.getPassageText).not.toHaveBeenCalled();
    expect(audio.prepareAdaptationAudio).toHaveBeenCalledWith('adaptation-1');
  });

  it('still returns a cached story if audio prepare fails', async () => {
    vi.mocked(planLimits.assertCanGenerate).mockResolvedValue(undefined);
    vi.mocked(prisma.passage.findUnique).mockResolvedValue({ id: 'passage-1' } as never);
    vi.mocked(adaptations.findByCacheKey).mockResolvedValue({
      id: 'adaptation-1',
      title: 'Cached story',
    });
    vi.mocked(userStories.upsertFromAdaptation).mockResolvedValue({ id: 'user-story-1' });
    vi.mocked(audio.prepareAdaptationAudio).mockRejectedValue(new Error('tts down'));

    const service = new StoryGenerationService(
      prisma as never,
      adaptations as never,
      userStories as never,
      {} as never,
      childProfiles as never,
      planLimits as never,
      bibleText as never,
      llm as never,
      audio as never
    );

    const result = await service.generateOrReuse({
      userId: 'dev-user-1',
      tier: 'free',
      payload: {
        passageSlug: 'mateus-2-1-3',
        bibleVersionId: '211',
        verseFrom: 1,
        verseTo: 3,
        ageTier: '3-5',
        languageStyle: 'rhymes',
        contentType: 'text',
        childProfileId: 'dev-child-1',
      },
    });

    expect(result.adaptationId).toBe('adaptation-1');
    expect(result.fromCache).toBe(true);
  });

  it('recovers when concurrent requests race on passage create', async () => {
    const { Prisma } = await import('@prisma/client');
    vi.mocked(planLimits.assertCanGenerate).mockResolvedValue(undefined);
    vi.mocked(prisma.passage.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'passage-1' } as never);
    vi.mocked(prisma.passage.create).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      })
    );
    vi.mocked(adaptations.findByCacheKey).mockResolvedValue({
      id: 'adaptation-1',
      title: 'Cached story',
    });
    vi.mocked(userStories.upsertFromAdaptation).mockResolvedValue({ id: 'user-story-1' });

    const service = new StoryGenerationService(
      prisma as never,
      adaptations as never,
      userStories as never,
      {} as never,
      childProfiles as never,
      planLimits as never,
      bibleText as never,
      llm as never,
      audio as never
    );

    const result = await service.generateOrReuse({
      userId: 'dev-user-1',
      tier: 'free',
      payload: {
        passageSlug: 'genesis-6-9',
        bibleVersionId: '211',
        verseFrom: 1,
        verseTo: 20,
        ageTier: '3-5',
        languageStyle: 'rhymes',
        contentType: 'text',
      },
    });

    expect(result.fromCache).toBe(true);
    expect(prisma.passage.create).toHaveBeenCalledOnce();
    expect(prisma.passage.findUnique).toHaveBeenCalledTimes(2);
  });
});
