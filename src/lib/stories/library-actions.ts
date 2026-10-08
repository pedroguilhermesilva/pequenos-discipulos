'use server';

import {
  getCurrentChildProfileId,
  getCurrentUserId,
  requireCurrentUser,
} from '@/lib/auth/get-current-user';
import { container } from '@/lib/container';
import { adaptationContentSchema, storyQuizSchema } from '@/lib/domain/schemas';
import type { StorySummary } from '@/lib/stories';

export async function getLibraryStoriesAction(): Promise<StorySummary[]> {
  const user = await requireCurrentUser();
  const childId = (await getCurrentChildProfileId()) ?? undefined;
  const userStories = await container.services.library.listForUser(user.id, childId);

  if (userStories.length > 0) {
    return userStories;
  }

  return container.services.library.listCommunity();
}

export async function getCollectionsAction() {
  const user = await requireCurrentUser();
  const childId = await getCurrentChildProfileId();
  if (!childId) return [];
  return container.services.collections.listByChild(user.id, childId);
}

export async function getChildStoriesAction(childProfileId?: string): Promise<StorySummary[]> {
  const userId = await getCurrentUserId();
  const childId = childProfileId ?? (await getCurrentChildProfileId()) ?? undefined;

  const userStories = await container.services.library.listForUser(userId, childId);
  if (userStories.length > 0) {
    return userStories;
  }

  return container.services.library.listCommunity();
}

export async function getUserStoryAction(storyId: string) {
  const user = await requireCurrentUser();
  return container.services.library.getUserStory(user.id, storyId);
}

export async function getPassageSourceVersesAction(input: {
  passageSlug: string;
  verseFrom: number;
  verseTo: number;
  bibleVersionId?: string;
}) {
  await requireCurrentUser();

  const passage = await container.prisma.passage.findUnique({
    where: { slug: input.passageSlug },
  });

  if (!passage) {
    return {
      ok: false as const,
      code: 'NOT_FOUND' as const,
      message: 'Passagem bíblica não encontrada.',
    };
  }

  const result = await container.services.bibleText.resolvePassageVerses({
    passage,
    verseFrom: input.verseFrom,
    verseTo: input.verseTo,
    bibleVersionId: input.bibleVersionId,
  });

  if (result.error) {
    return {
      ok: false as const,
      code: 'BIBLE_TEXT_FETCH_ERROR' as const,
      message: result.error,
    };
  }

  return {
    ok: true as const,
    data: {
      verses: result.verses,
      bibleVersionId: result.bibleVersionId,
    },
  };
}

export async function getAdaptationContentAction(adaptationId: string) {
  const adaptation = await container.repositories.adaptations.findById(adaptationId);
  if (!adaptation) {
    return { ok: false as const, code: 'NOT_FOUND' as const, message: 'Adaptação não encontrada.' };
  }

  const content = adaptationContentSchema.safeParse(adaptation.content);
  const quiz = adaptation.quiz ? storyQuizSchema.safeParse(adaptation.quiz) : null;

  return {
    ok: true as const,
    data: {
      title: adaptation.title,
      content: content.success ? content.data : null,
      quiz: quiz?.success ? quiz.data : null,
      adaptationNote: adaptation.adaptationNote,
    },
  };
}
