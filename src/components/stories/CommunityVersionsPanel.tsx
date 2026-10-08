'use client';

import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/cn';
import { AdaptationStatusBadge } from '@/components/stories/AdaptationStatusBadge';
import { ParentGateModal } from '@/components/stories/ParentGateModal';
import { adoptCommunityAdaptationAction } from '@/lib/stories/library-actions';

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

type PendingVote = { adaptationId: string; value: 1 | -1 };

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
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [adoptingId, setAdoptingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );
  const [parentGateOpen, setParentGateOpen] = useState(false);
  const [pendingVote, setPendingVote] = useState<PendingVote | null>(null);

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

  const submitVote = useCallback(
    async (adaptationId: string, value: 1 | -1) => {
      setFeedback(null);
      try {
        const response = await fetch('/api/votes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adaptationId, action: 'vote', value }),
        });
        const json = (await response.json()) as {
          ok: boolean;
          data?: { voteScore?: number; voteCount?: number };
          message?: string;
        };

        if (!response.ok || !json.ok) {
          setFeedback({
            variant: 'error',
            message: json.message ?? 'Não foi possível registrar o voto.',
          });
          return;
        }

        queryClient.setQueryData<CommunityVersionItem[]>(queryKey, (current) =>
          (current ?? []).map((version) =>
            version.id === adaptationId
              ? {
                  ...version,
                  voteScore: json.data?.voteScore ?? version.voteScore,
                  voteCount: json.data?.voteCount ?? version.voteCount,
                  userVote: value,
                }
              : version
          )
        );
      } catch {
        setFeedback({ variant: 'error', message: 'Falha de rede ao votar.' });
      }
    },
    [queryClient, queryKey]
  );

  const handleVoteRequest = (adaptationId: string, value: 1 | -1) => {
    setPendingVote({ adaptationId, value });
    setParentGateOpen(true);
  };

  const handleParentGateSuccess = () => {
    if (!pendingVote) return;
    void submitVote(pendingVote.adaptationId, pendingVote.value);
    setPendingVote(null);
  };

  const handleReport = async (versionId: string) => {
    setReportingId(versionId);
    setFeedback(null);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adaptationId: versionId }),
      });
      const json = (await response.json()) as {
        ok: boolean;
        data?: { withdrawn: boolean };
        message?: string;
      };
      if (!response.ok || !json.ok) {
        setFeedback({
          variant: 'error',
          message: json.message ?? 'Não foi possível registrar a denúncia.',
        });
        return;
      }
      setFeedback({
        variant: 'success',
        message: json.data?.withdrawn
          ? 'Obrigado. Esta versão foi retirada da comunidade.'
          : 'Denúncia registrada. Obrigado por ajudar a cuidar da comunidade.',
      });
      await queryClient.invalidateQueries({ queryKey });
    } catch {
      setFeedback({ variant: 'error', message: 'Falha de rede ao denunciar.' });
    } finally {
      setReportingId(null);
    }
  };

  const handleAdopt = async (versionId: string) => {
    setAdoptingId(versionId);
    setFeedback(null);
    try {
      const result = await adoptCommunityAdaptationAction(versionId, childProfileId);
      if (!result.ok) {
        setFeedback({
          variant: 'error',
          message: result.message ?? 'Não foi possível salvar esta versão.',
        });
        return;
      }
      setFeedback({
        variant: 'success',
        message: `Versão salva para ${childName}.`,
      });
      onAdopted?.({ adaptationId: versionId, userStoryId: result.data.userStoryId });
    } catch {
      setFeedback({ variant: 'error', message: 'Falha de rede ao salvar.' });
    } finally {
      setAdoptingId(null);
    }
  };

  return (
    <>
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

                      <div className="flex flex-wrap items-center gap-2">
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

                        {!version.isOwner ? (
                          <>
                            <button
                              type="button"
                              disabled={version.userVote === 1}
                              onClick={() => handleVoteRequest(version.id, 1)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-aprovado bg-aprovado-claro hover:bg-aprovado-claro/80 px-2.5 py-1 rounded-lg transition disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-aprovado"
                            >
                              <span className="material-symbols-outlined text-sm">thumb_up</span>
                              {version.userVote === 1 ? 'Votou +' : 'Votar +'}
                            </button>
                            <button
                              type="button"
                              disabled={version.userVote === -1}
                              onClick={() => handleVoteRequest(version.id, -1)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-oliva bg-pergaminho-escuro hover:bg-pergaminho-escuro/80 px-2.5 py-1 rounded-lg transition disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-oliva"
                            >
                              <span className="material-symbols-outlined text-sm">thumb_down</span>
                              {version.userVote === -1 ? 'Votou −' : 'Votar −'}
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-oliva italic">Sua versão</span>
                        )}

                        <button
                          type="button"
                          disabled={adoptingId === version.id}
                          onClick={() => void handleAdopt(version.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-vida bg-vida/10 hover:bg-vida/15 px-2.5 py-1 rounded-lg transition disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-vida"
                        >
                          <span className="material-symbols-outlined text-sm">bookmark_add</span>
                          {adoptingId === version.id ? 'Salvando...' : `Usar para ${childName}`}
                        </button>

                        <button
                          type="button"
                          disabled={reportingId === version.id}
                          onClick={() => void handleReport(version.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-oliva hover:text-laranja transition disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja rounded-lg px-1"
                        >
                          <span className="material-symbols-outlined text-sm">flag</span>
                          {reportingId === version.id ? 'Enviando...' : 'Denunciar'}
                        </button>
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

      <ParentGateModal
        open={parentGateOpen}
        onClose={() => {
          setParentGateOpen(false);
          setPendingVote(null);
        }}
        onSuccess={handleParentGateSuccess}
      />
    </>
  );
}
