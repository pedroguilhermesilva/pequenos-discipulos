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

export async function adoptCommunityAdaptationAction(adaptationId: string, childProfileId?: string) {
  const user = await requireCurrentUser();
  const childId = childProfileId ?? (await getCurrentChildProfileId()) ?? undefined;

  try {
    const result = await container.services.library.adoptCommunityAdaptation(
      user.id,
      adaptationId,
      childId
    );
    return { ok: true as const, data: result };
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      return {
        ok: false as const,
        code: (error as { code: string }).code,
        message: error.message,
      };
    }
    return {
      ok: false as const,
      code: 'INTERNAL_ERROR' as const,
      message: 'Não foi possível salvar esta versão.',
    };
  }
}

export async function getAdaptationContentAction(adaptationId: string) {
  const user = await requireCurrentUser();
  const adaptation = await container.repositories.adaptations.findById(adaptationId);
  if (!adaptation) {
    return { ok: false as const, code: 'NOT_FOUND' as const, message: 'Adaptação não encontrada.' };
  }

  const isOwner =
    adaptation.createdByUserId === user.id ||
    (await container.repositories.userStories.findByUserAndAdaptation(user.id, adaptationId)) !==
      null;

  if (
    !isOwner &&
    adaptation.status !== 'community' &&
    adaptation.status !== 'as_default'
  ) {
    return {
      ok: false as const,
      code: 'UNAUTHORIZED' as const,
      message: 'Esta versão não está disponível.',
    };
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
