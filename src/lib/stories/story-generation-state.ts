import type { StorySummary } from '@/lib/stories';

export function shouldShowDbLoading(params: {
  dbLoading: boolean;
  ready: boolean;
  generationComplete: boolean;
  isNewStory: boolean;
}): boolean {
  if (params.isNewStory || params.ready || params.generationComplete) {
    return false;
  }
  return params.dbLoading;
}

export function resolveDisplayedStory(params: {
  isNewStory: boolean;
  newStory: StorySummary;
  dbStory: StorySummary | null;
  generationComplete: boolean;
}): StorySummary | undefined {
  if (params.isNewStory) {
    return params.newStory;
  }
  if (params.dbStory) {
    return params.dbStory;
  }
  return params.generationComplete ? params.newStory : undefined;
}
