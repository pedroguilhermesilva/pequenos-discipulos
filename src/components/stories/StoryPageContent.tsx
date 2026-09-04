'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { PassageSelection } from '@/components/stories/PassageSelection';
import { GenerationTypeSelection } from '@/components/stories/GenerationTypeSelection';
import { StoryGenerating } from '@/components/stories/StoryGenerating';
import { StoryViewerContent } from '@/components/stories/StoryViewerContent';
import type { StorySummary } from '@/lib/stories';
import {
  getPassageById,
  getPassageIdFromReference,
  resolvePassageRange,
  type BibleVerseLine,
} from '@/lib/stories/bible-passages';
import { createNewStoryPlaceholder, getNewStoryEntryHref, isNewStoryId } from '@/lib/stories/new-story';
import { getActiveProfile, markProfileHasCreatedStory } from '@/lib/profiles/storage';
import { getUserStoryAction } from '@/lib/stories/library-actions';
import { buildStoryUrl, parseStorySearchParams } from '@/lib/stories/story-url';
import type { ContentType } from '@/lib/stories/types';
import Link from 'next/link';

export function StoryPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const storyId = params.id as string;

  const isNewStory = isNewStoryId(storyId);

  const [newStory, setNewStory] = useState(() => createNewStoryPlaceholder());
  const [dbStory, setDbStory] = useState<StorySummary | null>(null);
  const [dbLoading, setDbLoading] = useState(!isNewStory);
  const [resolvedStoryId, setResolvedStoryId] = useState<string | null>(
    isNewStory ? null : storyId
  );
  const [adaptationId, setAdaptationId] = useState<string | null>(null);
  const [dbPassageSlug, setDbPassageSlug] = useState<string | null>(null);
  const [dbVerseFrom, setDbVerseFrom] = useState<number | null>(null);
  const [dbVerseTo, setDbVerseTo] = useState<number | null>(null);
  const [dbContentType, setDbContentType] = useState<ContentType | null>(null);
  const [dbSourceVerses, setDbSourceVerses] = useState<BibleVerseLine[]>([]);

  useEffect(() => {
    if (!isNewStory) return;
    const active = getActiveProfile();
    if (active) setNewStory(createNewStoryPlaceholder(active.preferences));
  }, [isNewStory]);

  useEffect(() => {
    if (isNewStory) {
      setDbLoading(false);
      return;
    }

    let cancelled = false;

    async function loadStory() {
      setDbLoading(true);
      try {
        const detail = await getUserStoryAction(storyId);
        if (cancelled) return;

        if (detail) {
          setDbStory(detail.summary);
          setAdaptationId(detail.adaptationId);
          setDbPassageSlug(detail.passageSlug);
          setDbVerseFrom(detail.verseFrom);
          setDbVerseTo(detail.verseTo);
          setDbSourceVerses(detail.sourceVerses);
          setDbContentType(detail.summary.defaultContentType ?? null);
        } else {
          setDbStory(null);
          setDbSourceVerses([]);
        }
      } finally {
        if (!cancelled) setDbLoading(false);
      }
    }

    void loadStory();
    return () => {
      cancelled = true;
    };
  }, [isNewStory, storyId]);

  const story = isNewStory ? newStory : dbStory ?? undefined;

  const urlParams = parseStorySearchParams(searchParams);
  const passageId = urlParams.passageId ?? dbPassageSlug;
  const contentType = urlParams.contentType ?? dbContentType;
  const verseFrom = urlParams.verseFrom ?? dbVerseFrom;
  const verseTo = urlParams.verseTo ?? dbVerseTo;
  const ready = urlParams.ready;

  const passage = passageId ? getPassageById(passageId) : undefined;
  const passageRange = passage ? resolvePassageRange(passage, verseFrom, verseTo) : null;

  const hasExistingProgress = !isNewStory && (story?.progress ?? 0) > 0;
  const skipGeneration = Boolean(ready || hasExistingProgress || (!isNewStory && story && passageId && contentType));

  const [generationComplete, setGenerationComplete] = useState(skipGeneration);

  useEffect(() => {
    setGenerationComplete(skipGeneration);
  }, [skipGeneration, passageId, contentType]);

  const handleGenerationComplete = useCallback(
    (result: { userStoryId: string; adaptationId: string; title: string }) => {
      setGenerationComplete(true);
      setResolvedStoryId(result.userStoryId);
      setAdaptationId(result.adaptationId);
      setNewStory((prev) => ({ ...prev, id: result.userStoryId, title: result.title }));

      const active = getActiveProfile();
      if (active && !active.hasCreatedStory) {
        markProfileHasCreatedStory(active.id);
      }

      router.replace(
        buildStoryUrl(result.userStoryId, {
          passageId: passageId ?? undefined,
          contentType: contentType ?? undefined,
          ready: true,
          verseFrom: passageRange?.verseFrom,
          verseTo: passageRange?.verseTo,
        })
      );
    },
    [contentType, passageId, passageRange, router]
  );

  const handleViewerBack = useCallback(() => {
    const id = resolvedStoryId ?? storyId;
    if (passageId) {
      router.push(
        buildStoryUrl(id, {
          passageId,
          verseFrom: passageRange?.verseFrom,
          verseTo: passageRange?.verseTo,
        })
      );
    }
  }, [passageId, passageRange, resolvedStoryId, router, storyId]);

  if (dbLoading) {
    return (
      <AppShell>
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-vida/20 border-t-vida animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (!story) {
    return (
      <AppShell>
        <div className="text-center py-20 animate-fade-in">
          <span className="material-symbols-outlined text-oliva text-5xl mb-4">search_off</span>
          <h1 className="font-display text-2xl font-bold text-tinta mb-2">História não encontrada</h1>
          <p className="text-oliva mb-6">Esta história não existe na biblioteca.</p>
          <Link
            href="/biblioteca"
            className="inline-flex items-center gap-2 text-vida font-semibold hover:text-vida-dark transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Voltar à biblioteca
          </Link>
        </div>
      </AppShell>
    );
  }

  const suggestedPassageId = isNewStory ? undefined : getPassageIdFromReference(story.passage);
  const activeProfile = getActiveProfile();
  const backHref = isNewStory
    ? getNewStoryEntryHref(activeProfile?.hasCreatedStory)
    : '/biblioteca';

  return (
    <AppShell>
      {!passageId && (
        <PassageSelection
          storyId={storyId}
          storyTitle={story.title}
          suggestedPassageId={suggestedPassageId}
          backHref={backHref}
        />
      )}

      {passageId && !contentType && passageRange && (
        <GenerationTypeSelection
          storyId={storyId}
          passageId={passageId}
          passageRange={passageRange}
        />
      )}

      {passageId && contentType && passage && passageRange && !generationComplete && (
        <StoryGenerating
          contentType={contentType}
          storyTitle={story.title}
          passageSlug={passageId}
          verseFrom={passageRange.verseFrom}
          verseTo={passageRange.verseTo}
          preferences={activeProfile?.preferences}
          onComplete={handleGenerationComplete}
        />
      )}

      {passageId && contentType && passage && passageRange && generationComplete && (
        <StoryViewerContent
          story={story}
          passage={passage}
          passageRange={passageRange}
          contentType={contentType}
          adaptationId={adaptationId ?? undefined}
          userStoryId={resolvedStoryId ?? story.id}
          initialSourceVerses={dbSourceVerses.length > 0 ? dbSourceVerses : undefined}
          onBack={handleViewerBack}
        />
      )}

      {passageId && !passage && (
        <div className="text-center py-20 animate-fade-in">
          <h1 className="font-display text-2xl font-bold text-tinta mb-2">Passagem inválida</h1>
          <p className="text-oliva mb-6">A passagem selecionada não foi encontrada.</p>
          <Link
            href={buildStoryUrl(storyId)}
            className="inline-flex items-center gap-2 text-vida font-semibold hover:text-vida-dark transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Escolher outra passagem
          </Link>
        </div>
      )}
    </AppShell>
  );
}
