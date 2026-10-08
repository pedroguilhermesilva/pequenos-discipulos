'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ContentType } from '@/lib/stories/types';
import {
  formatPassageReference,
  toBibleVerseLines,
  type BiblePassage,
  type BibleVerseLine,
  type PassageRange,
} from '@/lib/stories/bible-passages';
import type { StorySummary } from '@/lib/stories';
import { STORY_IMAGE } from '@/lib/stories';
import { DEFAULT_PREFERENCES } from '@/lib/onboarding/defaults';
import { loadPreferencesFromStorage } from '@/lib/onboarding/storage';
import type { UserPreferences } from '@/lib/onboarding/types';
import { getAgeTierFromPreferences, getAgeTierLabel } from '@/lib/stories/age-tiers';
import { getStoryQuiz } from '@/lib/stories/story-quiz';
import { getAdaptationContentAction } from '@/lib/stories/library-actions';
import type { AdaptationContent, StoryQuizData } from '@/lib/domain/schemas';
import { cn } from '@/lib/cn';
import { AudioToast } from '@/components/stories/AudioToast';
import { BiblePassageDialog } from '@/components/stories/BiblePassageDialog';
import { BiblePassageTrigger } from '@/components/stories/BiblePassageTrigger';
import { ParentGateModal } from '@/components/stories/ParentGateModal';
import { StoryAdaptationContent } from '@/components/stories/StoryAdaptationContent';
import { StoryNarrationSection } from '@/components/stories/StoryNarrationSection';
import { StoryAgeContent } from '@/components/stories/StoryAgeContent';
import { AdaptationStatusBadge } from '@/components/stories/AdaptationStatusBadge';
import { CommunityVersionsPanel } from '@/components/stories/CommunityVersionsPanel';
import { StoryCollectionsSidebar } from '@/components/stories/StoryCollectionsSidebar';
import { useChildProfiles } from '@/components/profiles/ChildProfileProvider';
import { StoryQuizSection } from '@/components/stories/StoryQuizSection';
import type { StoryAudioPlayRequest } from '@/lib/stories/audio-play';
import {
  getShareButtonState,
  getShareSubmitFeedback,
} from '@/lib/moderation/status-labels';
interface StoryViewerContentProps {
  story: StorySummary;
  passage: BiblePassage;
  passageRange: PassageRange;
  contentType: ContentType;
  adaptationId?: string;
  userStoryId?: string;
  initialSourceVerses?: BibleVerseLine[];
  initialAdaptationContent?: AdaptationContent;
  initialAdaptationQuiz?: StoryQuizData;
  initialAdaptationNote?: string | null;
  onBack: () => void;
  onRegenerate?: () => void;
}

export function StoryViewerContent({
  story,
  passage,
  passageRange,
  contentType,
  adaptationId,
  userStoryId: _userStoryId,
  initialSourceVerses,
  initialAdaptationContent,
  initialAdaptationQuiz,
  initialAdaptationNote,
  onBack,
  onRegenerate,
}: StoryViewerContentProps) {
  const { activeProfile } = useChildProfiles();
  const [passageDialogOpen, setPassageDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(story.currentPage ?? 1);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [parentModalOpen, setParentModalOpen] = useState(false);
  const [parentAction, setParentAction] = useState<'vote' | 'share' | 'approve' | null>(null);
  const [saved, setSaved] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<{
    message: string;
    variant: 'success' | 'info' | 'error';
  } | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [rating, setRating] = useState(4.9);
  const [viewingAdaptationId, setViewingAdaptationId] = useState(adaptationId);
  const [viewingStatus, setViewingStatus] = useState<string | null>(null);
  const displayAdaptationId = viewingAdaptationId ?? adaptationId;
  const [audioToast, setAudioToast] = useState({
    visible: false,
    title: '',
    description: '',
    variant: 'success' as 'success' | 'error',
  });
  const [sourceVerses, setSourceVerses] = useState<BibleVerseLine[]>(() => {
    if (initialSourceVerses && initialSourceVerses.length > 0) {
      return initialSourceVerses;
    }
    if (passage.verses.length > 0) {
      return toBibleVerseLines(passage.verses, passageRange.verseFrom);
    }
    return [];
  });
  const [sourceLoading] = useState(false);
  const [adaptationContent, setAdaptationContent] = useState<AdaptationContent | null>(
    initialAdaptationContent ?? null
  );
  const [adaptationQuiz, setAdaptationQuiz] = useState<StoryQuizData | null>(
    initialAdaptationQuiz ?? null
  );
  const [adaptationNote, setAdaptationNote] = useState<string | null>(
    initialAdaptationNote ?? null
  );
  const [adaptationLoading, setAdaptationLoading] = useState(
    Boolean(displayAdaptationId) && !initialAdaptationContent
  );

  const totalPages = adaptationContent?.pages.length ?? story.totalPages;
  const passageReference = formatPassageReference(passage, passageRange);
  const passageExcerpt =
    sourceVerses
      .slice(0, 2)
      .map((verse) => verse.text)
      .join(' ') ||
    `Referência bíblica: ${passageReference}. O texto integral não é exibido aqui — a história adaptada segue esta passagem.`;
  const ageTier = useMemo(() => getAgeTierFromPreferences(preferences), [preferences]);
  const fallbackQuiz = useMemo(() => getStoryQuiz(story.id, ageTier), [story.id, ageTier]);
  const quiz = adaptationQuiz ?? fallbackQuiz;
  const isLastPage = currentPage >= totalPages;

  useEffect(() => {
    const stored = loadPreferencesFromStorage();
    if (stored) setPreferences(stored);
  }, []);

  useEffect(() => {
    if (initialSourceVerses && initialSourceVerses.length > 0) {
      setSourceVerses(initialSourceVerses);
      return;
    }

    if (passage.verses.length > 0) {
      setSourceVerses(toBibleVerseLines(passage.verses, passageRange.verseFrom));
    }
  }, [initialSourceVerses, passage.verses, passageRange.verseFrom]);

  useEffect(() => {
    if (initialAdaptationContent) {
      setAdaptationContent(initialAdaptationContent);
      setAdaptationLoading(false);
    }
  }, [initialAdaptationContent]);

  useEffect(() => {
    setViewingAdaptationId(adaptationId);
  }, [adaptationId]);

  useEffect(() => {
    if (!displayAdaptationId) {
      setAdaptationLoading(false);
      return;
    }

    if (displayAdaptationId === adaptationId && initialAdaptationContent) {
      return;
    }

    const currentAdaptationId = displayAdaptationId;
    let cancelled = false;

    async function loadAdaptation() {
      setAdaptationLoading(true);
      try {
        const result = await getAdaptationContentAction(currentAdaptationId);
        if (cancelled || !result.ok || !result.data) return;

        if (result.data.content) {
          setAdaptationContent(result.data.content);
        }
        if (result.data.quiz) {
          setAdaptationQuiz(result.data.quiz);
        }
        setAdaptationNote(result.data.adaptationNote ?? null);
      } finally {
        if (!cancelled) setAdaptationLoading(false);
      }
    }

    void loadAdaptation();
    return () => {
      cancelled = true;
    };
  }, [adaptationId, displayAdaptationId, initialAdaptationContent]);

  useEffect(() => {
    if (!displayAdaptationId) return;
    void fetch(`/api/adaptations/${displayAdaptationId}/status`)
      .then((response) => response.json())
      .then(
        (json: {
          ok: boolean;
          data?: { status: string; voteScore?: number };
        }) => {
          if (json.ok && json.data?.status) {
            setViewingStatus(json.data.status);
            if (json.data.voteScore != null) {
              setRating(json.data.voteScore);
            }
          }
        }
      )
      .catch(() => undefined);
  }, [displayAdaptationId]);

  const handleSelectCommunityVersion = useCallback((id: string) => {
    setViewingAdaptationId(id);
    setCurrentPage(1);
  }, []);

  const viewingOtherVersion = Boolean(
    adaptationId && displayAdaptationId && displayAdaptationId !== adaptationId
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handlePlayAudio = useCallback(
    async (request: StoryAudioPlayRequest) => {
      const showError = (description: string) => {
        setAudioToast({
          visible: true,
          title: 'Áudio indisponível',
          description,
          variant: 'error',
        });
      };

      setAudioToast({
        visible: true,
        title: request.title,
        description: request.description,
        variant: 'success',
      });

      const playUrl = async (url: string) => {
        const audio = new Audio(url);
        try {
          await audio.play();
        } catch {
          showError('Não foi possível reproduzir o áudio neste navegador.');
        }
      };

      if (request.audioPath) {
        await playUrl(request.audioPath);
        return;
      }

      if (!displayAdaptationId) {
        showError('Gere uma adaptação da história para ouvir os sons interativos.');
        return;
      }

      try {
        const response = await fetch('/api/audio/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adaptationId: displayAdaptationId,
            blockKey: request.blockKey,
            kind: request.kind,
            text: request.text,
            sfxPrompt: request.sfxPrompt,
            tagSom: request.tagSom,
            textoParaAudio: request.textoParaAudio,
          }),
        });
        const json = (await response.json()) as {
          ok: boolean;
          message?: string;
          data?: { url: string };
        };

        if (json.ok && json.data?.url) {
          await playUrl(json.data.url);
          return;
        }

        showError(json.message ?? 'Não foi possível gerar o áudio.');
      } catch {
        showError('Falha de rede ao gerar o áudio.');
      }
    },
    [displayAdaptationId]
  );

  const hideAudioToast = useCallback(() => {
    setAudioToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const openParentGate = (action: 'vote' | 'share' | 'approve') => {
    setParentAction(action);
    setParentModalOpen(true);
  };

  useEffect(() => {
    if (!adaptationId) return;
    void fetch(`/api/adaptations/${adaptationId}/status`)
      .then((response) => response.json())
      .then((json: { ok: boolean; data?: { status: string; message?: string | null } }) => {
        if (json.ok && json.data) {
          setShareStatus(json.data.status);
          if (json.data.message) {
            setShareFeedback({
              message: json.data.message,
              variant:
                json.data.status === 'rejected'
                  ? 'error'
                  : json.data.status === 'community'
                    ? 'success'
                    : 'info',
            });
          }
        }
      })
      .catch(() => undefined);
  }, [adaptationId]);

  const handleParentSuccess = async () => {
    if (!adaptationId || !parentAction) {
      setParentAction(null);
      return;
    }

    const action =
      parentAction === 'approve'
        ? 'family_approve'
        : parentAction === 'share'
          ? 'share_community'
          : 'vote';

    if (action === 'share_community') {
      setIsSharing(true);
      setShareFeedback(null);
    }

    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adaptationId,
          action,
          value: 1,
        }),
      });
      const json = (await response.json()) as {
        ok: boolean;
        data?: { voteScore?: number; status?: string; reason?: string | null };
        message?: string;
      };
      if (json.ok && json.data?.voteScore) {
        setRating(json.data.voteScore);
      }
      if (action === 'family_approve') {
        setSaved(true);
      }
      if (action === 'share_community' && json.ok && json.data?.status) {
        setShareStatus(json.data.status);
        setShareFeedback(getShareSubmitFeedback(json.data.status, json.data.reason));
      } else if (action === 'share_community' && !json.ok) {
        setShareFeedback({
          variant: 'error',
          message: json.message ?? 'Não foi possível enviar para a comunidade. Tente de novo.',
        });
      }
    } catch {
      if (parentAction === 'share') {
        setShareFeedback({
          variant: 'error',
          message: 'Falha de rede ao compartilhar. Verifique a conexão e tente de novo.',
        });
      }
    } finally {
      if (action === 'share_community') {
        setIsSharing(false);
      }
    }

    setParentAction(null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 flex-1 min-h-0">
        {/* Main column */}
        <div className="lg:col-span-8 flex flex-col gap-4 min-h-0">
          <div className="bg-white rounded-livro-xl border border-borda shadow-sm flex flex-col overflow-hidden flex-1 min-h-0">
            <div className="px-5 md:px-6 pt-5 md:pt-6 pb-4 border-b border-borda shrink-0">
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1 text-oliva hover:text-tinta transition-colors font-semibold text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja rounded mb-3"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Voltar
              </button>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <h2 className="font-display text-xl md:text-2xl font-bold text-tinta">{story.title}</h2>
                  {viewingStatus ? (
                    <AdaptationStatusBadge status={viewingStatus} voteScore={rating} compact />
                  ) : null}
                </div>
                <p className="text-sm text-oliva shrink-0">
                  <span className="inline-flex items-center font-semibold text-laranja bg-laranja-suave px-2 py-0.5 rounded-md text-xs">
                    {passageReference}
                  </span>
                  <span className="mx-2 text-borda" aria-hidden="true">
                    ·
                  </span>
                  <span>Adaptado para {getAgeTierLabel(ageTier)}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-oliva border-b border-borda px-5 py-3 shrink-0">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-laranja">auto_awesome</span>
                Versão adaptada via IA
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-base">volume_up</span>
                {contentType === 'audio'
                  ? 'Toque em play para ouvir a narração'
                  : 'Clique nos botões para ouvir'}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-5 md:p-8">
              <BiblePassageTrigger
                className="mb-6 lg:hidden"
                passageReference={passageReference}
                excerpt={passageExcerpt}
                onClick={() => setPassageDialogOpen(true)}
              />

              {/* Illustration */}
              <div className="relative w-full max-w-xl mx-auto aspect-[4/3] rounded-livro-xl overflow-hidden shadow-livro-lg ring-4 ring-pergaminho-escuro mb-8">
                {contentType === 'video' ? (
                  <div className="w-full h-full bg-tinta/90 flex items-center justify-center">
                    <button
                      type="button"
                      aria-label="Reproduzir vídeo"
                      className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <span
                        className="material-symbols-outlined text-5xl"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        play_arrow
                      </span>
                    </button>
                  </div>
                ) : (
                  <>
                    <img
                      alt="Ilustração da história"
                      className="w-full h-full object-cover"
                      src={story.image || STORY_IMAGE}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-tinta/20 to-transparent" />
                  </>
                )}
              </div>

              {displayAdaptationId ? (
                adaptationLoading || !adaptationContent ? (
                  <p
                    className="text-center text-oliva text-sm py-8"
                    data-testid="story-adaptation-loading"
                  >
                    Carregando adaptação...
                  </p>
                ) : contentType === 'audio' ? (
                  <StoryNarrationSection
                    adaptationId={displayAdaptationId}
                    pageIndex={currentPage - 1}
                    content={adaptationContent}
                    onPageChange={(nextPageIndex) => {
                      setCurrentPage(nextPageIndex + 1);
                    }}
                    onNarrationReady={(patch) => {
                      setAdaptationContent((current) => {
                        if (!current) return current;
                        const slices = new Map(
                          patch.pages.map((page) => [page.pageIndex, page])
                        );
                        return {
                          ...current,
                          storyNarrationAudioPath: patch.storyNarrationAudioPath,
                          storyNarrationAlignment: patch.storyNarrationAlignment,
                          pages: current.pages.map((page, index) => {
                            const slice = slices.get(index);
                            if (!slice) return page;
                            return {
                              ...page,
                              narrationAudioPath: patch.storyNarrationAudioPath,
                              narrationAlignment: slice.alignment,
                              narrationStartSeconds: slice.startSeconds,
                              narrationEndSeconds: slice.endSeconds,
                            };
                          }),
                        };
                      });
                    }}
                  />
                ) : (
                  <StoryAdaptationContent
                    content={adaptationContent}
                    pageIndex={currentPage - 1}
                    onPlayAudio={handlePlayAudio}
                  />
                )
              ) : (
                <StoryAgeContent tier={ageTier} onPlayAudio={handlePlayAudio} />
              )}

              {isLastPage && quiz && <StoryQuizSection quiz={quiz} />}
            </div>

            {adaptationId ? (
              <div className="lg:hidden px-5 pt-4">
                <CommunityVersionsPanel
                  anchorAdaptationId={adaptationId}
                  viewingAdaptationId={displayAdaptationId}
                  childName={preferences.childName}
                  childProfileId={activeProfile?.id}
                  onSelectVersion={handleSelectCommunityVersion}
                  onAdopted={({ adaptationId: adoptedId }) => {
                    setViewingAdaptationId(adoptedId);
                  }}
                />
              </div>
            ) : null}

            {/* Footer actions — só para a versão da família; votar outras versões fica no painel da comunidade */}
            {!viewingOtherVersion ? (
              <div className="px-5 py-4 border-t border-borda flex flex-wrap items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => openParentGate('approve')}
                  className={cn(
                    'flex shrink-0 items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl transition',
                    saved
                      ? 'bg-aprovado-claro text-aprovado border border-aprovado/20'
                      : 'text-oliva bg-pergaminho-escuro hover:bg-pergaminho-escuro/80'
                  )}
                >
                  <span className="material-symbols-outlined text-base">
                    {saved ? 'verified' : 'family_restroom'}
                  </span>
                  {saved ? `Aprovada pela família (${rating} ★)` : 'Aprovar em família'}
                </button>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {onRegenerate && adaptationId && (
                    <button
                      type="button"
                      onClick={onRegenerate}
                      className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-vida bg-vida/10 hover:bg-vida/15 border border-vida/25 px-3 py-2.5 rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-vida"
                    >
                      <span className="material-symbols-outlined text-base">autorenew</span>
                      Gerar novamente
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openParentGate('share')}
                    disabled={getShareButtonState(shareStatus).disabled || isSharing}
                    className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-ceu bg-ceu-claro hover:bg-ceu-claro/80 border border-ceu/20 px-3 py-2.5 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-base">
                      {isSharing ? 'hourglass_top' : 'groups'}
                    </span>
                    {isSharing ? 'Enviando…' : getShareButtonState(shareStatus).label}
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-5 py-4 border-t border-borda text-xs text-oliva">
                Você está lendo uma versão da comunidade. Use os botões acima para votar ou salvar
                para {preferences.childName}.
              </div>
            )}
            {shareFeedback ? (
              <div
                role="alert"
                className={cn(
                  'mx-5 mb-4 mt-1 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-medium',
                  shareFeedback.variant === 'error' &&
                    'border-red-200 bg-red-50 text-red-800',
                  shareFeedback.variant === 'success' &&
                    'border-aprovado/30 bg-aprovado-claro text-aprovado',
                  shareFeedback.variant === 'info' &&
                    'border-ceu/30 bg-ceu-claro text-tinta'
                )}
              >
                <span className="material-symbols-outlined shrink-0 text-lg">
                  {shareFeedback.variant === 'error'
                    ? 'error'
                    : shareFeedback.variant === 'success'
                      ? 'check_circle'
                      : 'info'}
                </span>
                <p>{shareFeedback.message}</p>
              </div>
            ) : null}
          </div>

          {/* Page navigation footer */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-1 shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-oliva">
                Página {currentPage} de {totalPages}
              </span>
              <div className="w-32 md:w-48 h-2 bg-borda/60 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber to-laranja h-full rounded-full transition-all duration-500"
                  style={{ width: `${(currentPage / totalPages) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Página anterior"
                className="w-10 h-10 rounded-full border border-borda flex items-center justify-center text-oliva hover:text-laranja hover:border-laranja transition-all disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja"
              >
                <span className="material-symbols-outlined text-sm">arrow_back_ios_new</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label="Próxima página"
                className="w-10 h-10 rounded-full bg-gradient-to-r from-amber to-laranja text-white flex items-center justify-center shadow-livro hover:from-amber/90 hover:to-laranja/90 hover:scale-105 transition-all disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja"
              >
                <span className="material-symbols-outlined text-sm font-bold">arrow_forward_ios</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar column */}
        <div className="lg:col-span-4 space-y-4">
          <BiblePassageTrigger
            className="hidden lg:block"
            passageReference={passageReference}
            excerpt={passageExcerpt}
            onClick={() => setPassageDialogOpen(true)}
          />

          <StoryCollectionsSidebar
            currentStory={story}
            childName={preferences.childName}
            adaptationId={adaptationId}
            viewingAdaptationId={displayAdaptationId}
            onSelectVersion={handleSelectCommunityVersion}
            onAdopted={({ adaptationId: adoptedId }) => {
              setViewingAdaptationId(adoptedId);
            }}
          />
        </div>
      </div>

      <BiblePassageDialog
        open={passageDialogOpen}
        onClose={() => setPassageDialogOpen(false)}
        passage={passage}
        passageReference={passageReference}
        verses={sourceVerses}
        verseFrom={passageRange.verseFrom}
        loading={sourceLoading}
        adaptationNote={adaptationNote}
      />

      <ParentGateModal
        open={parentModalOpen}
        onClose={() => setParentModalOpen(false)}
        onSuccess={handleParentSuccess}
      />

      <AudioToast
        title={audioToast.title}
        description={audioToast.description}
        visible={audioToast.visible}
        variant={audioToast.variant}
        onHide={hideAudioToast}
      />
    </div>
  );
}
