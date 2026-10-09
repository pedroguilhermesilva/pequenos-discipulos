'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { PassageSelection } from '@/components/stories/PassageSelection';
import { GenerationTypeSelection } from '@/components/stories/GenerationTypeSelection';
import { StoryGenerating } from '@/components/stories/StoryGenerating';
import { StoryViewerContent } from '@/components/stories/StoryViewerContent';
import type { StorySummary } from '@/lib/stories';
import type { AdaptationContent, StoryQuizData } from '@/lib/domain/schemas';
import {
  getPassageById,
  getPassageIdFromReference,
  resolvePassageRange,
  type BibleVerseLine,
} from '@/lib/stories/bible-passages';
import { createNewStoryPlaceholder, getNewStoryEntryHref, isNewStoryId } from '@/lib/stories/new-story';
import { useChildProfiles } from '@/components/profiles/ChildProfileProvider';
import { markProfileHasCreatedStory } from '@/lib/profiles/storage';
import { getUserStoryAction } from '@/lib/stories/library-actions';
import {
  resolveDisplayedStory,
  shouldShowDbLoading,
} from '@/lib/stories/story-generation-state';
import {
  buildStoryUrl,
  parseStorySearchParams,
  parsedStorySearchParamsFromRecord,
  type ParsedStorySearchParams,
} from '@/lib/stories/story-url';
import type { ContentType } from '@/lib/stories/types';
import Link from 'next/link';

type StoryPageContentProps = {
  storyId: string;
  serverSearchParams?: Record<string, string | string[] | undefined>;
};

export function StoryPageContent({ storyId, serverSearchParams }: StoryPageContentProps) {
  return (
    <AppShell>
      <StoryPageInner storyId={storyId} serverSearchParams={serverSearchParams} />
    </AppShell>
  );
}

function mergeStorySearchParams(
  serverSearchParams: Record<string, string | string[] | undefined> | undefined,
  clientSearchParams: URLSearchParams
): ParsedStorySearchParams {
  if (clientSearchParams.size > 0) {
    return parseStorySearchParams(clientSearchParams);
  }
  return parsedStorySearchParamsFromRecord(serverSearchParams ?? {});
}

function StoryPageInner({ storyId, serverSearchParams }: StoryPageContentProps) {
  const router = useRouter();
  const clientSearchParams = useSearchParams();
  const { activeProfile } = useChildProfiles();

  const urlParams = useMemo(
    () => mergeStorySearchParams(serverSearchParams, clientSearchParams),
    [clientSearchParams, serverSearchParams]
  );

  const routeIsNewStory = isNewStoryId(storyId);
  const persistedStoryId = urlParams.historiaId;
  const effectiveStoryId = persistedStoryId ?? storyId;
  const isCreationRoute = routeIsNewStory && !urlParams.ready;

  const [newStory, setNewStory] = useState(() => createNewStoryPlaceholder());
  const [dbStory, setDbStory] = useState<StorySummary | null>(null);
  const [dbLoading, setDbLoading] = useState(!isCreationRoute && !urlParams.ready);
  const [resolvedStoryId, setResolvedStoryId] = useState<string | null>(
    persistedStoryId ?? (routeIsNewStory ? null : storyId)
  );
  const [adaptationId, setAdaptationId] = useState<string | null>(null);
  const [initialAdaptationContent, setInitialAdaptationContent] = useState<AdaptationContent | null>(
    null
  );
  const [initialAdaptationQuiz, setInitialAdaptationQuiz] = useState<StoryQuizData | null>(null);
  const [initialAdaptationNote, setInitialAdaptationNote] = useState<string | null>(null);
  const [dbPassageSlug, setDbPassageSlug] = useState<string | null>(null);
  const [dbVerseFrom, setDbVerseFrom] = useState<number | null>(null);
  const [dbVerseTo, setDbVerseTo] = useState<number | null>(null);
  const [dbContentType, setDbContentType] = useState<ContentType | null>(null);
  const [dbSourceVerses, setDbSourceVerses] = useState<BibleVerseLine[]>([]);
  const [dbSourceVersesError, setDbSourceVersesError] = useState<string | null>(null);
  const [dbBibleVersionId, setDbBibleVersionId] = useState<string | null>(null);

  useEffect(() => {
    if (!routeIsNewStory || !activeProfile) return;
    setNewStory(createNewStoryPlaceholder(activeProfile.preferences));
  }, [activeProfile, routeIsNewStory]);

  useEffect(() => {
    if (isCreationRoute) {
      setDbLoading(false);
      return;
    }

    let cancelled = false;

    async function loadStory() {
      const shouldBlockUi = !urlParams.ready;
      if (shouldBlockUi) {
        setDbLoading(true);
      }

      try {
        const detail = await getUserStoryAction(effectiveStoryId);
        if (cancelled) return;

        if (detail) {
          setDbStory(detail.summary);
          setAdaptationId((current) => current ?? detail.adaptationId);
          setDbPassageSlug(detail.passageSlug);
          setDbVerseFrom(detail.verseFrom);
          setDbVerseTo(detail.verseTo);
          setDbSourceVerses(detail.sourceVerses);
          setDbSourceVersesError(detail.sourceVersesError ?? null);
          setDbBibleVersionId(detail.bibleVersionId);
          setDbContentType(detail.summary.defaultContentType ?? null);
          setResolvedStoryId((current) => current ?? effectiveStoryId);
        } else {
          setDbStory(null);
          setDbSourceVerses([]);
          setDbSourceVersesError(null);
          setDbBibleVersionId(null);
        }
      } finally {
        if (!cancelled && shouldBlockUi) {
          setDbLoading(false);
        }
      }
    }

    void loadStory();
    return () => {
      cancelled = true;
    };
  }, [effectiveStoryId, isCreationRoute, urlParams.ready]);

  const passageId = urlParams.passageId ?? dbPassageSlug;
  const contentType = urlParams.contentType ?? dbContentType;
  const verseFrom = urlParams.verseFrom ?? dbVerseFrom;
  const verseTo = urlParams.verseTo ?? dbVerseTo;
  const ready = urlParams.ready;

  const provisionalStory = routeIsNewStory ? newStory : dbStory ?? undefined;
  const hasExistingProgress = !routeIsNewStory && (provisionalStory?.progress ?? 0) > 0;
  const skipGeneration = Boolean(
    ready || hasExistingProgress || (!routeIsNewStory && provisionalStory && passageId && contentType)
  );

  const [generationComplete, setGenerationComplete] = useState(skipGeneration);
  const [generationMode, setGenerationMode] = useState<'initial' | 'regenerate'>('initial');

  const story = resolveDisplayedStory({
    isNewStory: routeIsNewStory,
    newStory,
    dbStory,
    generationComplete,
  });

  const passage = passageId ? getPassageById(passageId) : undefined;
  const passageRange = passage ? resolvePassageRange(passage, verseFrom, verseTo) : null;

  useEffect(() => {
    if (skipGeneration) {
      setGenerationComplete(true);
    }
  }, [skipGeneration]);

  useEffect(() => {
    if (persistedStoryId) {
      setResolvedStoryId(persistedStoryId);
      setGenerationComplete(true);
    }
  }, [persistedStoryId]);

  const handleGenerationComplete = useCallback(
    (result: {
      userStoryId: string;
      adaptationId: string;
      title: string;
      content: AdaptationContent;
      quiz?: StoryQuizData;
      adaptationNote?: string | null;
    }) => {
      setGenerationComplete(true);
      setGenerationMode('initial');
      setResolvedStoryId(result.userStoryId);
      setAdaptationId(result.adaptationId);
      setInitialAdaptationContent(result.content);
      setInitialAdaptationQuiz(result.quiz ?? null);
      setInitialAdaptationNote(result.adaptationNote ?? null);
      setNewStory((prev) => ({ ...prev, id: result.userStoryId, title: result.title }));

      void (async () => {
        try {
          const detail = await getUserStoryAction(result.userStoryId);
          if (detail) {
            setDbSourceVerses(detail.sourceVerses);
            setDbSourceVersesError(detail.sourceVersesError ?? null);
            setDbBibleVersionId(detail.bibleVersionId);
          }
        } catch {
          // A janela da passagem ainda pode carregar o texto sob demanda.
        }
      })();

      if (activeProfile && !activeProfile.hasCreatedStory) {
        markProfileHasCreatedStory(activeProfile.id);
      }

      router.replace(
        buildStoryUrl(storyId, {
          passageId: passageId ?? undefined,
          contentType: contentType ?? undefined,
          ready: true,
          historiaId: result.userStoryId,
          verseFrom: passageRange?.verseFrom,
          verseTo: passageRange?.verseTo,
        }),
        { scroll: false }
      );
    },
    [activeProfile, contentType, passageId, passageRange, router, storyId]
  );

  const handleRegenerate = useCallback(() => {
    setGenerationMode('regenerate');
    setGenerationComplete(false);
    setInitialAdaptationContent(null);
    setInitialAdaptationQuiz(null);
    setInitialAdaptationNote(null);
  }, []);

  const handleViewerBack = useCallback(() => {
    const id = resolvedStoryId ?? effectiveStoryId;
    if (passageId) {
      router.push(
        buildStoryUrl(id, {
          passageId,
          verseFrom: passageRange?.verseFrom,
          verseTo: passageRange?.verseTo,
        })
      );
    }
  }, [effectiveStoryId, passageId, passageRange, resolvedStoryId, router]);

  if (
    shouldShowDbLoading({
      dbLoading,
      ready: Boolean(ready),
      generationComplete,
      isNewStory: routeIsNewStory,
    })
  ) {
    return (
      <div
        className="min-h-[40vh] flex items-center justify-center"
        data-testid="story-page-loading"
      >
        <div className="w-10 h-10 rounded-full border-2 border-vida/20 border-t-vida animate-spin" />
      </div>
    );
  }

  if (!story) {
    return (
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
    );
  }

  const suggestedPassageId = routeIsNewStory ? undefined : getPassageIdFromReference(story.passage);
  const backHref = routeIsNewStory
    ? getNewStoryEntryHref(activeProfile?.hasCreatedStory)
    : '/biblioteca';

  return (
    <>
      {!passageId && (
        <PassageSelection
          storyId={storyId}
          storyTitle={story.title}
          suggestedPassageId={suggestedPassageId}
          backHref={backHref}
          initialBookId={urlParams.bookId ?? undefined}
          initialChapter={urlParams.chapter ?? undefined}
          initialVerseFrom={urlParams.verseFrom ?? undefined}
          initialVerseTo={urlParams.verseTo ?? undefined}
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
          childProfileId={activeProfile?.id}
          mode={generationMode}
          currentAdaptationId={adaptationId ?? undefined}
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
          initialSourceVersesError={dbSourceVersesError}
          bibleVersionId={dbBibleVersionId ?? undefined}
          initialAdaptationContent={initialAdaptationContent ?? undefined}
          initialAdaptationQuiz={initialAdaptationQuiz ?? undefined}
          initialAdaptationNote={initialAdaptationNote ?? undefined}
          onBack={handleViewerBack}
          onRegenerate={handleRegenerate}
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
    </>
  );
}
