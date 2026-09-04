import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import {
  getAdaptationContentAction,
  getLibraryStoriesAction,
  getUserStoryAction,
} from '@/lib/stories/library-actions';

const DEV_USER_ID = process.env.DEV_USER_ID ?? 'dev-user-1';

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: () => undefined,
    set: vi.fn(),
  })),
}));

describe('library-actions', () => {
  beforeEach(() => {
    process.env.DEV_USER_ID = DEV_USER_ID;
  });

  it('lists seeded library stories for the dev user', async () => {
    const stories = await getLibraryStoriesAction();
    expect(stories.length).toBeGreaterThan(0);
    expect(stories.some((story) => story.title === 'A Estrela de Mateus')).toBe(true);
  });

  it('loads a seeded user story by id', async () => {
    const detail = await getUserStoryAction('dev-story-1');
    expect(detail).not.toBeNull();
    expect(detail?.summary.title).toBe('A Estrela de Mateus');
    expect(detail?.passageSlug).toBe('mateus-2-1-3');
  });

  it('returns null for unknown user story ids', async () => {
    const detail = await getUserStoryAction('missing-story-id');
    expect(detail).toBeNull();
  });

  it('returns adaptation content for a seeded adaptation', async () => {
    const adaptation = await prisma.passageAdaptation.findFirst({
      where: {
        passage: { slug: 'mateus-2-1-3' },
        ageTier: 'TIER_3_5',
        contentType: 'text',
      },
    });

    expect(adaptation).not.toBeNull();

    const result = await getAdaptationContentAction(adaptation!.id);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.title).toBe('A Estrela de Mateus');
    expect(result.data.content?.pages.length).toBeGreaterThan(0);
  });

  it('returns not found for unknown adaptation ids', async () => {
    const result = await getAdaptationContentAction('missing-adaptation-id');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('NOT_FOUND');
  });

  it('uses the dev user from env when listing stories', async () => {
    const userStories = await prisma.userStory.findMany({
      where: { userId: DEV_USER_ID },
    });
    expect(userStories.length).toBeGreaterThan(0);

    const stories = await getLibraryStoriesAction();
    expect(stories.some((story) => userStories.some((row) => row.id === story.id))).toBe(true);
  });
});
