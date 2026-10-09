'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdaptationStatusBadge } from '@/components/stories/AdaptationStatusBadge';
import { StoryAdaptationContent } from '@/components/stories/StoryAdaptationContent';
import { CommunityVersionActions } from '@/components/community/CommunityVersionActions';
import { useChildProfiles } from '@/components/profiles/ChildProfileProvider';
import { getAdaptationContentAction } from '@/lib/stories/library-actions';
import type { AdaptationContent } from '@/lib/domain/schemas';
type ReaderMeta = {
  status: string;
  voteScore: number;
  voteCount: number;
  userVote: 1 | -1 | null;
  isCreatedByViewer: boolean;
  passageReference?: string;
  ageTierLabel?: string;
  title?: string;
};

interface CommunityVersionReaderProps {
  adaptationId: string;
}

export function CommunityVersionReader({ adaptationId }: CommunityVersionReaderProps) {
  const router = useRouter();
  const { activeProfile } = useChildProfiles();
  const [content, setContent] = useState<AdaptationContent | null>(null);
  const [meta, setMeta] = useState<ReaderMeta | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [contentResult, statusResponse] = await Promise.all([
          getAdaptationContentAction(adaptationId),
          fetch(`/api/adaptations/${adaptationId}/status`),
        ]);

        if (cancelled) return;

        if (contentResult.ok && contentResult.data?.content) {
          setContent(contentResult.data.content);
        }

        const statusJson = (await statusResponse.json()) as {
          ok: boolean;
          data?: {
            status: string;
            voteScore: number;
            voteCount: number;
            isCreatedByViewer?: boolean;
            userVote?: 1 | -1 | null;
          };
        };

        if (statusJson.ok && statusJson.data) {
          setMeta({
            status: statusJson.data.status,
            voteScore: statusJson.data.voteScore,
            voteCount: statusJson.data.voteCount,
            userVote: statusJson.data.userVote ?? null,
            isCreatedByViewer: statusJson.data.isCreatedByViewer ?? false,
            title: contentResult.ok ? contentResult.data?.title : undefined,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [adaptationId]);

  const childName = activeProfile?.preferences.childName ?? 'criança';
  const totalPages = content?.pages.length ?? 0;

  if (loading) {
    return <p className="text-oliva text-sm py-12 text-center">Carregando história…</p>;
  }

  if (!content || !meta) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-oliva">Esta versão não está disponível.</p>
        <Link href="/comunidade" className="text-vida font-semibold hover:underline">
          Voltar à comunidade
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      <Link
        href="/comunidade"
        className="inline-flex items-center gap-1 text-oliva hover:text-tinta text-sm font-semibold"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Voltar à comunidade
      </Link>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-tinta">
            {meta.title ?? 'Versão da comunidade'}
          </h1>
          <AdaptationStatusBadge status={meta.status} voteScore={meta.voteScore} />
        </div>
        <p className="text-sm text-oliva">
          ★ {meta.voteScore} ({meta.voteCount} {meta.voteCount === 1 ? 'voto' : 'votos'})
        </p>
      </header>

      {feedback ? (
        <p
          role="alert"
          className={
            feedback.variant === 'success'
              ? 'text-sm bg-aprovado-claro text-aprovado rounded-xl px-4 py-3'
              : 'text-sm bg-red-50 text-red-700 rounded-xl px-4 py-3'
          }
        >
          {feedback.message}
        </p>
      ) : null}

      <div className="bg-white rounded-livro-xl border border-borda shadow-sm p-6 md:p-8">
        <StoryAdaptationContent
          content={content}
          pageIndex={pageIndex}
          onPlayAudio={() => {
            setFeedback({
              variant: 'error',
              message: 'Salve a versão na biblioteca para ouvir os sons interativos.',
            });
          }}
        />
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={pageIndex <= 0}
            onClick={() => setPageIndex((value) => Math.max(0, value - 1))}
            className="w-10 h-10 rounded-full border border-borda flex items-center justify-center disabled:opacity-40"
            aria-label="Página anterior"
          >
            <span className="material-symbols-outlined text-sm">arrow_back_ios_new</span>
          </button>
          <span className="text-sm text-oliva font-semibold">
            Página {pageIndex + 1} de {totalPages}
          </span>
          <button
            type="button"
            disabled={pageIndex >= totalPages - 1}
            onClick={() => setPageIndex((value) => Math.min(totalPages - 1, value + 1))}
            className="w-10 h-10 rounded-full bg-laranja text-white flex items-center justify-center disabled:opacity-40"
            aria-label="Próxima página"
          >
            <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
          </button>
        </div>
      ) : null}

      {meta.isCreatedByViewer ? (
        <p className="text-sm text-oliva bg-pergaminho-escuro/60 rounded-xl px-4 py-3">
          Esta versão foi criada pela sua família. Ela continua na sua biblioteca — aqui você só
          pode ler e denunciar, se necessário.
        </p>
      ) : null}

      <CommunityVersionActions
        version={{
          id: adaptationId,
          userVote: meta.userVote,
        }}
        childName={childName}
        childProfileId={activeProfile?.id}
        size="md"
        allowVoteAndAdopt={!meta.isCreatedByViewer}
        onFeedback={(message, variant) => setFeedback({ message, variant })}
        onVoteSuccess={({ voteScore, voteCount, value }) => {
          setMeta((current) =>
            current
              ? { ...current, voteScore, voteCount, userVote: value }
              : current
          );
        }}
        onAdopted={({ userStoryId }) => {
          router.push(`/stories/${userStoryId}?pronto=1`);
        }}
      />
    </div>
  );
}
