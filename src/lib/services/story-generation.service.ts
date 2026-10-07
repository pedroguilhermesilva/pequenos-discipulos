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
  type AdaptationContent,
  type GenerateStoryInput,
  type StoryQuizData,
} from '@/lib/domain/schemas';
import type { LlmProvider } from '@/lib/providers/interfaces/llm.provider';
import type { AdaptationRepository } from '@/lib/repositories/interfaces/adaptation.repository';
import type { ChildProfileRepository } from '@/lib/repositories/interfaces/child-profile.repository';
import type { UsageRepository } from '@/lib/repositories/interfaces/usage.repository';
import type { UserStoryRepository } from '@/lib/repositories/interfaces/user-story.repository';
import { AudioService } from '@/lib/services/audio.service';
import { currentUsageMonth, PlanLimitsService } from '@/lib/services/plan-limits.service';
import {
  buildAdaptationCacheKey,
  StoryCacheService,
} from '@/lib/services/story-cache.service';
import { getBookMeta } from '@/lib/stories/bible-metadata';
import {
  formatPassageReference,
  getPassageById,
  getSelectionFromPassageId,
} from '@/lib/stories/bible-passages';
import { resolveBibleVersionId } from '@/lib/stories/bible-versions';

export type GenerateStoryResult = {
  adaptationId: string;
  userStoryId: string;
  title: string;
  content: AdaptationContent;
  quiz?: StoryQuizData;
  adaptationNote?: string | null;
};

const IDEMPOTENCY_TTL_MS = 5 * 60 * 1000;
const IDEMPOTENCY_PENDING_TITLE = '__pending__';
const IDEMPOTENCY_WAIT_MS = 120_000;
const IDEMPOTENCY_POLL_MS = 250;

export class StoryGenerationService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly adaptations: AdaptationRepository,
    private readonly userStories: UserStoryRepository,
    private readonly usage: UsageRepository,
    private readonly childProfiles: ChildProfileRepository,
    private readonly planLimits: PlanLimitsService,
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

    if (payload.idempotencyKey) {
      const cachedResult = await this.findIdempotentResult(
        input.userId,
        payload.idempotencyKey
      );
      if (cachedResult) {
        return this.hydrateGenerateStoryResult(cachedResult);
      }

      const claimed = await this.claimIdempotencyKey(
        input.userId,
        payload.idempotencyKey
      );
      if (!claimed) {
        const resolved = await this.waitForIdempotentResult(
          input.userId,
          payload.idempotencyKey
        );
        if (resolved) {
          return this.hydrateGenerateStoryResult(resolved);
        }
      }
    }

    const selection = getSelectionFromPassageId(payload.passageSlug);
    if (!selection) {
      throw new AdaptationNotFound(`Passagem inválida: ${payload.passageSlug}`);
    }

    const bibleVersionId = resolveBibleVersionId(payload.bibleVersionId);
    const ageTier = toPrismaAgeTier(payload.ageTier);
    const contentType = toPrismaContentType(payload.contentType);

    const bookMeta = getBookMeta(selection.bookId);
    const passageEntity = getPassageById(payload.passageSlug);
    const reference =
      passageEntity && bookMeta
        ? formatPassageReference(passageEntity, {
            verseFrom: payload.verseFrom,
            verseTo: payload.verseTo,
          })
        : `${bookMeta?.name ?? selection.bookId} ${selection.chapter}:${payload.verseFrom}–${payload.verseTo}`;

    const passage = await this.findOrCreatePassage(payload.passageSlug, {
      reference,
      book: bookMeta?.name ?? selection.bookId,
      preview: `Passagem ${reference}`,
      sourceText: { reference } as Prisma.InputJsonValue,
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
      const cached = await this.storyCache.pickHighestScoredUnseenCachedAdaptation({
        lookupKey,
        cacheKey,
        userId: input.userId,
        childProfileId: payload.childProfileId,
        excludeAdaptationIds: payload.currentAdaptationId
          ? [payload.currentAdaptationId]
          : undefined,
      });

      if (cached) {
        const result = await this.attachAdaptationToUser({
          userId: input.userId,
          childProfileId: payload.childProfileId,
          adaptation: cached,
          cacheKey,
          source: 'cached',
        });
        await this.storeIdempotentResult(input.userId, payload.idempotencyKey, result);
        return result;
      }
    }

    await this.planLimits.assertCanGenerate(input.userId, input.tier, contentType);

    const generated = await this.llm.generateStory({
      reference,
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
      content: content.data,
      quiz,
      adaptationNote: generated.adaptationNote,
    });

    await this.prepareAudio(adaptation.id);
    await this.storeIdempotentResult(input.userId, payload.idempotencyKey, result);
    return result;
  }

  private async hydrateGenerateStoryResult(
    result: Pick<GenerateStoryResult, 'adaptationId' | 'userStoryId' | 'title'>
  ): Promise<GenerateStoryResult> {
    const adaptation = await this.prisma.passageAdaptation.findUnique({
      where: { id: result.adaptationId },
    });
    if (!adaptation) {
      throw new AdaptationNotFound(`Adaptação não encontrada: ${result.adaptationId}`);
    }

    const content = adaptationContentSchema.safeParse(adaptation.content);
    if (!content.success) {
      throw new LlmValidationError('Adaptação sem conteúdo válido.');
    }

    const quiz = adaptation.quiz
      ? storyQuizSchema.safeParse(adaptation.quiz).success
        ? storyQuizSchema.parse(adaptation.quiz)
        : undefined
      : undefined;

    return {
      ...result,
      content: content.data,
      quiz,
      adaptationNote: adaptation.adaptationNote,
    };
  }

  private async findIdempotentResult(
    userId: string,
    idempotencyKey?: string
  ): Promise<Pick<GenerateStoryResult, 'adaptationId' | 'userStoryId' | 'title'> | null> {
    if (!idempotencyKey) return null;

    const existing = await this.prisma.storyGenerationIdempotency.findUnique({
      where: {
        userId_idempotencyKey: { userId, idempotencyKey },
      },
    });

    if (
      !existing ||
      existing.expiresAt <= new Date() ||
      existing.title === IDEMPOTENCY_PENDING_TITLE ||
      !existing.adaptationId ||
      !existing.userStoryId
    ) {
      return null;
    }

    return {
      adaptationId: existing.adaptationId,
      userStoryId: existing.userStoryId,
      title: existing.title,
    };
  }

  private async claimIdempotencyKey(
    userId: string,
    idempotencyKey: string
  ): Promise<boolean> {
    try {
      await this.prisma.storyGenerationIdempotency.create({
        data: {
          userId,
          idempotencyKey,
          adaptationId: '',
          userStoryId: '',
          title: IDEMPOTENCY_PENDING_TITLE,
          expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
        },
      });
      return true;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return false;
      }
      throw error;
    }
  }

  private async waitForIdempotentResult(
    userId: string,
    idempotencyKey: string
  ): Promise<GenerateStoryResult | null> {
    const deadline = Date.now() + IDEMPOTENCY_WAIT_MS;

    while (Date.now() < deadline) {
      const resolved = await this.findIdempotentResult(userId, idempotencyKey);
      if (resolved) {
        return this.hydrateGenerateStoryResult(resolved);
      }
      await new Promise((resolve) => setTimeout(resolve, IDEMPOTENCY_POLL_MS));
    }

    return null;
  }

  private async storeIdempotentResult(
    userId: string,
    idempotencyKey: string | undefined,
    result: GenerateStoryResult
  ): Promise<void> {
    if (!idempotencyKey) return;

    await this.prisma.storyGenerationIdempotency.updateMany({
      where: {
        userId,
        idempotencyKey,
        title: IDEMPOTENCY_PENDING_TITLE,
      },
      data: {
        adaptationId: result.adaptationId,
        userStoryId: result.userStoryId,
        title: result.title,
        expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
      },
    });
  }

  private async attachAdaptationToUser(params: {
    userId: string;
    childProfileId?: string;
    adaptation: {
      id: string;
      title: string;
      content?: unknown;
      quiz?: unknown;
      adaptationNote?: string | null;
    };
    cacheKey: string;
    source: 'cached' | 'generated';
    totalPages?: number;
    content?: AdaptationContent;
    quiz?: StoryQuizData;
    adaptationNote?: string | null;
  }): Promise<GenerateStoryResult> {
    const parsedContent = params.content
      ?? (adaptationContentSchema.safeParse(params.adaptation.content).success
        ? adaptationContentSchema.parse(params.adaptation.content)
        : null);
    if (!parsedContent) {
      throw new LlmValidationError('Adaptação sem conteúdo válido.');
    }

    const parsedQuiz =
      params.quiz ??
      (params.adaptation.quiz
        ? storyQuizSchema.safeParse(params.adaptation.quiz).success
          ? storyQuizSchema.parse(params.adaptation.quiz)
          : undefined
        : undefined);
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
      content: parsedContent,
      quiz: parsedQuiz,
      adaptationNote: params.adaptationNote ?? params.adaptation.adaptationNote ?? null,
    };
  }

  private async prepareAudio(adaptationId: string) {
    try {
      await this.audio.prepareAdaptationAudio(adaptationId);
    } catch (error) {
      console.error('[StoryGeneration] Falha ao preparar áudio da adaptação', error);
    }
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
