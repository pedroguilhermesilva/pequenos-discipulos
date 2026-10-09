'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/cn';
import { AdaptationStatusBadge } from '@/components/stories/AdaptationStatusBadge';
import { CommunityVersionActions } from '@/components/community/CommunityVersionActions';

export type CommunityVersionItem = {
  id: string;
  title: string;
  voteScore: number;
  voteCount: number;
  excerpt: string;
  status: string;
  userVote: 1 | -1 | null;
  isOwner: boolean;
};

interface CommunityVersionsPanelProps {
  anchorAdaptationId?: string;
  viewingAdaptationId?: string;
  childName?: string;
  childProfileId?: string;
  onSelectVersion: (adaptationId: string) => void;
  onAdopted?: (payload: { adaptationId: string; userStoryId: string }) => void;
  className?: string;
}

export function CommunityVersionsPanel({
  anchorAdaptationId,
  viewingAdaptationId,
  childName = 'criança',
  childProfileId,
  onSelectVersion,
  onAdopted,
  className,
}: CommunityVersionsPanelProps) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(true);
  const [feedback, setFeedback] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );

  const queryKey = ['community-versions', anchorAdaptationId ?? 'none'];

  const { data: communityVersions = [], isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<CommunityVersionItem[]> => {
      if (!anchorAdaptationId) return [];
      const response = await fetch(`/api/adaptations/${anchorAdaptationId}/versions`);
      if (!response.ok) return [];
      const json = (await response.json()) as {
        ok: boolean;
        data?: Array<{
          id: string;
          title: string;
          voteScore: number;
          voteCount: number;
          adaptationNote?: string | null;
          status: string;
          userVote?: 1 | -1 | null;
          isOwner?: boolean;
        }>;
      };
      if (!json.ok || !json.data?.length) return [];
      return json.data.map((item) => ({
        id: item.id,
        title: item.title,
        voteScore: item.voteScore,
        voteCount: item.voteCount,
        excerpt: item.adaptationNote ?? 'Versão aprovada pela comunidade',
        status: item.status,
        userVote: item.userVote ?? null,
        isOwner: item.isOwner ?? false,
      }));
    },
    enabled: Boolean(anchorAdaptationId),
  });

  return (
    <div
      className={cn(
        'bg-white rounded-livro-xl border border-borda shadow-sm space-y-3',
        className
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="w-full flex items-center justify-between gap-2 p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja rounded-livro-xl"
        aria-expanded={expanded}
      >
        <h3 className="font-display font-bold text-sm text-tinta flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-ceu">groups</span>
          Outras versões da comunidade
        </h3>
        <span className="material-symbols-outlined text-base text-oliva shrink-0">
          {expanded ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {expanded ? (
        <div className="px-5 pb-5 space-y-3 -mt-2">
          <p className="text-xs text-oliva">
            Coexistem múltiplas adaptações para o mesmo trecho. A comunidade define o padrão.
          </p>

          {feedback ? (
            <p
              role="alert"
              className={cn(
                'text-xs rounded-lg px-3 py-2',
                feedback.variant === 'success'
                  ? 'bg-aprovado-claro text-aprovado'
                  : 'bg-red-50 text-red-700'
              )}
            >
              {feedback.message}
            </p>
          ) : null}

          {isLoading ? (
            <p className="text-xs text-oliva/80">Carregando versões...</p>
          ) : communityVersions.length > 0 ? (
            <div className="space-y-2 pt-1">
              {communityVersions.map((version) => {
                const isViewing = version.id === viewingAdaptationId;
                return (
                  <div
                    key={version.id}
                    className={cn(
                      'w-full text-left p-3 rounded-livro border text-xs space-y-2 transition',
                      isViewing
                        ? 'border-laranja/40 bg-laranja-suave/60'
                        : 'border-borda bg-pergaminho-escuro/30'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectVersion(version.id)}
                        className="min-w-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja rounded"
                      >
                        <span className="font-bold text-tinta block truncate">{version.title}</span>
                        <span className="text-laranja font-bold mt-0.5 inline-block">
                          ★ {version.voteScore}
                          {version.voteCount > 0 ? (
                            <span className="text-oliva font-normal ml-1">
                              ({version.voteCount} {version.voteCount === 1 ? 'voto' : 'votos'})
                            </span>
                          ) : null}
                        </span>
                      </button>
                      <AdaptationStatusBadge
                        status={version.status}
                        voteScore={version.voteScore}
                        compact
                      />
                    </div>

                    <p className="text-oliva text-[11px] line-clamp-2">{version.excerpt}</p>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => onSelectVersion(version.id)}
                        className={cn(
                          'inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja',
                          isViewing
                            ? 'bg-laranja text-white'
                            : 'bg-white text-tinta border border-borda hover:border-laranja/40'
                        )}
                      >
                        <span className="material-symbols-outlined text-sm">menu_book</span>
                        {isViewing ? 'Lendo agora' : 'Ver versão'}
                      </button>

                      <CommunityVersionActions
                        version={version}
                        childName={childName}
                        childProfileId={childProfileId}
                        onFeedback={(message, variant) => setFeedback({ message, variant })}
                        onVoteSuccess={({ adaptationId, voteScore, voteCount, value }) => {
                          queryClient.setQueryData<CommunityVersionItem[]>(queryKey, (current) =>
                            (current ?? []).map((row) =>
                              row.id === adaptationId
                                ? { ...row, voteScore, voteCount, userVote: value }
                                : row
                            )
                          );
                        }}
                        onAdopted={onAdopted}
                        onReportSuccess={() =>
                          void queryClient.invalidateQueries({ queryKey })
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-oliva/80 pt-1">
              Ainda não há outras versões publicadas para esta passagem.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
