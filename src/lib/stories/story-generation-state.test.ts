import { describe, expect, it } from 'vitest';
import type { StorySummary } from '@/lib/stories';
import {
  resolveDisplayedStory,
  shouldShowDbLoading,
} from '@/lib/stories/story-generation-state';

const sampleStory: StorySummary = {
  id: 'story-1',
  title: 'História',
  ageGroup: '3-5 anos',
  passage: '',
  progress: 0,
  totalPages: 4,
  image: '/img.png',
  themes: [],
};

describe('story-generation-state', () => {
  it('hides db loading after generation completes or when ready=1', () => {
    expect(
      shouldShowDbLoading({
        dbLoading: true,
        ready: true,
        generationComplete: false,
        isNewStory: false,
      })
    ).toBe(false);

    expect(
      shouldShowDbLoading({
        dbLoading: true,
        ready: false,
        generationComplete: true,
        isNewStory: false,
      })
    ).toBe(false);
  });

  it('shows db loading only for persisted stories still fetching', () => {
    expect(
      shouldShowDbLoading({
        dbLoading: true,
        ready: false,
        generationComplete: false,
        isNewStory: false,
      })
    ).toBe(true);
  });

  it('keeps placeholder story visible while db fetch runs after generation', () => {
    const displayed = resolveDisplayedStory({
      isNewStory: false,
      newStory: { ...sampleStory, id: 'resolved-id', title: 'Gerada' },
      dbStory: null,
      generationComplete: true,
    });

    expect(displayed?.id).toBe('resolved-id');
    expect(displayed?.title).toBe('Gerada');
  });
});
