'use server';

import {
  getCurrentChildProfileId,
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
  const user = await requireCurrentUser();
  const childId = childProfileId ?? (await getCurrentChildProfileId()) ?? undefined;
  return container.services.library.listForUser(user.id, childId);
}

export async function getUserStoryAction(storyId: string) {
  const user = await requireCurrentUser();
  return container.services.library.getUserStory(user.id, storyId);
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
