import { createHash } from 'node:crypto';
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
import { getSelectionFromPassageId } from '@/lib/stories/bible-passages';

export type GenerateStoryResult = {
  adaptationId: string;
  userStoryId: string;
  fromCache: boolean;
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
    private readonly audio: Pick<AudioService, 'prepareAdaptationAudio'>
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

    await this.planLimits.assertCanGenerate(
      input.userId,
      input.tier,
      toPrismaContentType(payload.contentType)
    );

    const passage = await this.findOrCreatePassage(payload.passageSlug, {
      reference: `${selection.bookId} ${selection.chapter}:${payload.verseFrom}–${payload.verseTo}`,
      book: selection.bookId,
      preview: `Passagem ${payload.passageSlug}`,
      sourceText: { verses: [] },
    });

    const ageTier = toPrismaAgeTier(payload.ageTier);
    const contentType = toPrismaContentType(payload.contentType);

    const cached = await this.adaptations.findByCacheKey({
      passageId: passage.id,
      bibleVersionId: payload.bibleVersionId,
      verseFrom: payload.verseFrom,
      verseTo: payload.verseTo,
      ageTier,
      languageStyle: payload.languageStyle,
      contentType,
    });

    if (cached) {
      const userStory = await this.userStories.upsertFromAdaptation({
        userId: input.userId,
        childProfileId: payload.childProfileId,
        adaptationId: cached.id,
      });

      if (payload.childProfileId) {
        await this.childProfiles.update(payload.childProfileId, { hasCreatedStory: true });
      }

      await this.prepareAudio(cached.id);

      return {
        adaptationId: cached.id,
        userStoryId: userStory.id,
        fromCache: true,
        title: cached.title,
      };
    }

    const bible = await this.bibleText.getPassageText({
      bibleVersionId: payload.bibleVersionId,
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

    const idempotencyKey =
      payload.idempotencyKey ??
      createHash('sha256')
        .update(
          [
            input.userId,
            payload.passageSlug,
            payload.bibleVersionId,
            payload.verseFrom,
            payload.verseTo,
            payload.ageTier,
            payload.languageStyle,
            payload.contentType,
          ].join('|')
        )
        .digest('hex');

    void idempotencyKey;

    const result = await this.prisma.$transaction(async (tx) => {
      // Re-check cache inside transaction for double-click safety
      const again = await tx.passageAdaptation.findFirst({
        where: {
          passageId: passage.id,
          bibleVersionId: payload.bibleVersionId,
          verseFrom: payload.verseFrom,
          verseTo: payload.verseTo,
          ageTier,
          languageStyle: payload.languageStyle,
          contentType,
        },
      });

      const adaptation =
        again ??
        (await tx.passageAdaptation.create({
          data: {
            passageId: passage.id,
            bibleVersionId: payload.bibleVersionId,
            verseFrom: payload.verseFrom,
            verseTo: payload.verseTo,
            ageTier,
            languageStyle: payload.languageStyle,
            contentType,
            content: content.data,
            quiz: quiz ?? undefined,
            adaptationNote: generated.adaptationNote,
            title: generated.title,
            status: 'draft',
            version: 1,
          },
        }));

      const existingStory = await tx.userStory.findFirst({
        where: {
          userId: input.userId,
          adaptationId: adaptation.id,
          childProfileId: payload.childProfileId ?? undefined,
        },
      });

      const userStory =
        existingStory ??
        (await tx.userStory.create({
          data: {
            userId: input.userId,
            childProfileId: payload.childProfileId,
            adaptationId: adaptation.id,
          },
        }));

      if (!again) {
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
      }

      if (payload.childProfileId) {
        await tx.childProfile.update({
          where: { id: payload.childProfileId },
          data: { hasCreatedStory: true },
        });
      }

      const totalPages = content.data.pages.length;
      await tx.readingProgress.upsert({
        where: { userStoryId: userStory.id },
        update: { totalPages },
        create: {
          userStoryId: userStory.id,
          currentPage: 1,
          totalPages,
        },
      });

      return {
        adaptationId: adaptation.id,
        userStoryId: userStory.id,
        fromCache: Boolean(again),
        title: adaptation.title,
      };
    });

    await this.prepareAudio(result.adaptationId);

    return result;
  }

  private async prepareAudio(adaptationId: string) {
    try {
      await this.audio.prepareAdaptationAudio(adaptationId);
    } catch (error) {
      console.error('[StoryGeneration] Falha ao preparar áudio da adaptação', error);
    }
  }

  /**
   * Avoids P2002 when two requests try to create the same passage slug at once
   * (e.g. React Strict Mode double-mount or rapid double-click).
   */
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
    data: Pick<Passage, 'reference' | 'book' | 'preview'> & { sourceText: Passage['sourceText'] }
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
