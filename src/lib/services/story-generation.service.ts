import { Prisma, type Passage, type PrismaClient, type SubscriptionTier } from '@prisma/client';
import {
  AdaptationNotFound,
  LlmValidationError,
} from '@/lib/domain/errors';
import { toPrismaAgeTier, toPrismaContentType } from '@/lib/domain/mappers';
import {
  adaptationContentSchema,
  generateStoryInputSchema,
  storyQuizSchema,
  type GenerateStoryInput,
} from '@/lib/domain/schemas';
import type { LlmProvider } from '@/lib/providers/interfaces/llm.provider';
import type { AdaptationRepository } from '@/lib/repositories/interfaces/adaptation.repository';
import type { ChildProfileRepository } from '@/lib/repositories/interfaces/child-profile.repository';
import type { UsageRepository } from '@/lib/repositories/interfaces/usage.repository';
import type { UserStoryRepository } from '@/lib/repositories/interfaces/user-story.repository';
import { AudioService } from '@/lib/services/audio.service';
import { BibleTextService } from '@/lib/services/bible-text.service';
import { currentUsageMonth, PlanLimitsService } from '@/lib/services/plan-limits.service';
import {
  buildAdaptationCacheKey,
  StoryCacheService,
} from '@/lib/services/story-cache.service';
import { getSelectionFromPassageId } from '@/lib/stories/bible-passages';
import { resolveBibleVersionId } from '@/lib/stories/bible-versions';

export type GenerateStoryResult = {
  adaptationId: string;
  userStoryId: string;
  title: string;
};

export class StoryGenerationService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly adaptations: AdaptationRepository,
    private readonly userStories: UserStoryRepository,
    private readonly usage: UsageRepository,
    private readonly childProfiles: ChildProfileRepository,
    private readonly planLimits: PlanLimitsService,
    private readonly bibleText: BibleTextService,
    private readonly llm: LlmProvider,
    private readonly audio: Pick<AudioService, 'prepareAdaptationAudio'>,
    private readonly storyCache: StoryCacheService
  ) {}

  async generateOrReuse(input: {
    userId: string;
    tier: SubscriptionTier;
    payload: GenerateStoryInput;
  }): Promise<GenerateStoryResult> {
    const payload = generateStoryInputSchema.parse(input.payload);
    const selection = getSelectionFromPassageId(payload.passageSlug);
    if (!selection) {
      throw new AdaptationNotFound(`Passagem inválida: ${payload.passageSlug}`);
    }

    const bibleVersionId = resolveBibleVersionId(payload.bibleVersionId);
    const ageTier = toPrismaAgeTier(payload.ageTier);
    const contentType = toPrismaContentType(payload.contentType);

    const passage = await this.findOrCreatePassage(payload.passageSlug, {
      reference: `${selection.bookId} ${selection.chapter}:${payload.verseFrom}–${payload.verseTo}`,
      book: selection.bookId,
      preview: `Passagem ${payload.passageSlug}`,
      sourceText: { verses: [] } as Prisma.InputJsonValue,
    });

    const lookupKey = {
      passageId: passage.id,
      bibleVersionId,
      verseFrom: payload.verseFrom,
      verseTo: payload.verseTo,
      ageTier,
      languageStyle: payload.languageStyle,
      contentType,
    };
    const cacheKey = buildAdaptationCacheKey(lookupKey);

    const cachedViewsShown = await this.storyCache.countCachedViewsShown(
      input.userId,
      payload.childProfileId,
      cacheKey
    );

    if (this.storyCache.shouldTryCachedView(cachedViewsShown)) {
      const cached = await this.storyCache.pickRandomUnseenCachedAdaptation({
        lookupKey,
        cacheKey,
        userId: input.userId,
        childProfileId: payload.childProfileId,
        excludeAdaptationIds: payload.currentAdaptationId
          ? [payload.currentAdaptationId]
          : undefined,
      });

      if (cached) {
        return this.attachAdaptationToUser({
          userId: input.userId,
          childProfileId: payload.childProfileId,
          adaptation: cached,
          cacheKey,
          source: 'cached',
        });
      }
    }

    await this.planLimits.assertCanGenerate(input.userId, input.tier, contentType);

    const bible = await this.bibleText.getPassageText({
      bibleVersionId,
      bookId: selection.bookId,
      chapter: selection.chapter,
      verseFrom: payload.verseFrom,
      verseTo: payload.verseTo,
    });

    await this.persistPassageSourceText(
      passage.id,
      bible.verses,
      payload.verseFrom,
      payload.verseTo
    );

    const generated = await this.llm.generateStory({
      sourceText: bible.rawText,
      reference: bible.reference,
      ageTier: payload.ageTier,
      languageStyle: payload.languageStyle,
      contentType: payload.contentType,
    });

    const content = adaptationContentSchema.safeParse(generated.content);
    if (!content.success) {
      throw new LlmValidationError(content.error.message);
    }

    const quiz = generated.quiz
      ? storyQuizSchema.safeParse(generated.quiz).success
        ? generated.quiz
        : undefined
      : undefined;

    const nextVersion = await this.storyCache.getNextVersionNumber(lookupKey);

    const adaptation = await this.prisma.$transaction(async (tx) => {
      const created = await tx.passageAdaptation.create({
        data: {
          passageId: lookupKey.passageId,
          bibleVersionId: lookupKey.bibleVersionId,
          verseFrom: lookupKey.verseFrom,
          verseTo: lookupKey.verseTo,
          ageTier: lookupKey.ageTier,
          languageStyle: lookupKey.languageStyle,
          contentType: lookupKey.contentType,
          content: content.data as Prisma.InputJsonValue,
          quiz: (quiz ?? undefined) as Prisma.InputJsonValue | undefined,
          adaptationNote: generated.adaptationNote,
          title: generated.title,
          status: 'draft',
          version: nextVersion,
          createdByUserId: input.userId,
        },
      });

      const month = currentUsageMonth();
      await tx.usageEvent.upsert({
        where: {
          userId_contentType_month: {
            userId: input.userId,
            contentType,
            month,
          },
        },
        update: { count: { increment: 1 } },
        create: {
          userId: input.userId,
          contentType,
          month,
          count: 1,
        },
      });

      if (payload.childProfileId) {
        await tx.childProfile.update({
          where: { id: payload.childProfileId },
          data: { hasCreatedStory: true },
        });
      }

      return created;
    });

    const result = await this.attachAdaptationToUser({
      userId: input.userId,
      childProfileId: payload.childProfileId,
      adaptation,
      cacheKey,
      source: 'generated',
      totalPages: content.data.pages.length,
    });

    await this.prepareAudio(adaptation.id);
    return result;
  }

  private async attachAdaptationToUser(params: {
    userId: string;
    childProfileId?: string;
    adaptation: { id: string; title: string };
    cacheKey: string;
    source: 'cached' | 'generated';
    totalPages?: number;
  }): Promise<GenerateStoryResult> {
    const userStory = await this.userStories.upsertFromAdaptation({
      userId: params.userId,
      childProfileId: params.childProfileId,
      adaptationId: params.adaptation.id,
    });

    if (params.childProfileId) {
      await this.childProfiles.update(params.childProfileId, { hasCreatedStory: true });
    }

    if (params.totalPages) {
      await this.prisma.readingProgress.upsert({
        where: { userStoryId: userStory.id },
        update: { totalPages: params.totalPages },
        create: {
          userStoryId: userStory.id,
          currentPage: 1,
          totalPages: params.totalPages,
        },
      });
    }

    await this.storyCache.recordView({
      userId: params.userId,
      childProfileId: params.childProfileId,
      adaptationId: params.adaptation.id,
      cacheKey: params.cacheKey,
      source: params.source,
    });

    await this.prepareAudio(params.adaptation.id);

    return {
      adaptationId: params.adaptation.id,
      userStoryId: userStory.id,
      title: params.adaptation.title,
    };
  }

  private async prepareAudio(adaptationId: string) {
    try {
      await this.audio.prepareAdaptationAudio(adaptationId);
    } catch (error) {
      console.error('[StoryGeneration] Falha ao preparar áudio da adaptação', error);
    }
  }

  private async persistPassageSourceText(
    passageId: string,
    verses: Array<{ number: number; text: string }>,
    verseFrom: number,
    verseTo: number
  ) {
    const verseTexts = Array.from({ length: verseTo - verseFrom + 1 }, (_, index) => {
      const number = verseFrom + index;
      return verses.find((verse) => verse.number === number)?.text?.trim() ?? '';
    }).filter((text) => text.length > 0);

    if (verseTexts.length === 0) return;

    const existing = await this.prisma.passage.findUnique({
      where: { id: passageId },
      select: { sourceText: true },
    });
    const stored = existing?.sourceText as { verses?: string[] } | null | undefined;
    const hasStoredVerses = (stored?.verses?.length ?? 0) > 0;

    if (hasStoredVerses) return;

    await this.prisma.passage.update({
      where: { id: passageId },
      data: { sourceText: { verses: verseTexts } },
    });
  }

  private async findOrCreatePassage(
    slug: string,
    data: Pick<Passage, 'reference' | 'book' | 'preview'> & { sourceText: Prisma.InputJsonValue }
  ): Promise<Passage> {
    const existing = await this.prisma.passage.findUnique({ where: { slug } });
    if (existing) return existing;

    try {
      return await this.prisma.passage.create({
        data: { slug, ...data },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const raced = await this.prisma.passage.findUnique({ where: { slug } });
        if (raced) return raced;
      }
      throw error;
    }
  }
}
