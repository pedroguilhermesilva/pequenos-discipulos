'use client';

import { useCallback, useState } from 'react';
import { ParentGateModal } from '@/components/stories/ParentGateModal';
import { cn } from '@/lib/cn';
import { adoptCommunityAdaptationAction } from '@/lib/stories/library-actions';

export type CommunityVersionActionItem = {
  id: string;
  userVote: 1 | -1 | null;
};

interface CommunityVersionActionsProps {
  version: CommunityVersionActionItem;
  childName?: string;
  childProfileId?: string;
  size?: 'sm' | 'md';
  showReadLink?: boolean;
  readHref?: string;
  readLabel?: string;
  onVoteSuccess?: (payload: {
    adaptationId: string;
    voteScore: number;
    voteCount: number;
    value: 1 | -1;
  }) => void;
  onAdopted?: (payload: { adaptationId: string; userStoryId: string }) => void;
  onReportSuccess?: () => void;
  onFeedback?: (message: string, variant: 'success' | 'error') => void;
  /** When false, hides vote and adopt (e.g. direct link to own family version). */
  allowVoteAndAdopt?: boolean;
  className?: string;
}

type PendingVote = { adaptationId: string; value: 1 | -1 };

export function CommunityVersionActions({
  version,
  childName = 'criança',
  childProfileId,
  size = 'sm',
  showReadLink = false,
  readHref,
  readLabel = 'Ler versão',
  onVoteSuccess,
  onAdopted,
  onReportSuccess,
  onFeedback,
  allowVoteAndAdopt = true,
  className,
}: CommunityVersionActionsProps) {
  const [reporting, setReporting] = useState(false);
  const [adopting, setAdopting] = useState(false);
  const [parentGateOpen, setParentGateOpen] = useState(false);
  const [pendingVote, setPendingVote] = useState<PendingVote | null>(null);

  const buttonClass =
    size === 'sm'
      ? 'inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition disabled:opacity-50 focus:outline-none focus-visible:ring-2'
      : 'inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition disabled:opacity-50 focus:outline-none focus-visible:ring-2';

  const submitVote = useCallback(
    async (adaptationId: string, value: 1 | -1) => {
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
          onFeedback?.(json.message ?? 'Não foi possível registrar o voto.', 'error');
          return;
        }

        onVoteSuccess?.({
          adaptationId,
          voteScore: json.data?.voteScore ?? 0,
          voteCount: json.data?.voteCount ?? 0,
          value,
        });
        onFeedback?.('Voto registrado. Obrigado!', 'success');
      } catch {
        onFeedback?.('Falha de rede ao votar.', 'error');
      }
    },
    [onFeedback, onVoteSuccess]
  );

  const handleReport = async () => {
    setReporting(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adaptationId: version.id }),
      });
      const json = (await response.json()) as {
        ok: boolean;
        data?: { withdrawn: boolean };
        message?: string;
      };
      if (!response.ok || !json.ok) {
        onFeedback?.(json.message ?? 'Não foi possível registrar a denúncia.', 'error');
        return;
      }
      onFeedback?.(
        json.data?.withdrawn
          ? 'Obrigado. Esta versão foi retirada da comunidade.'
          : 'Denúncia registrada. Obrigado por ajudar a cuidar da comunidade.',
        'success'
      );
      onReportSuccess?.();
    } catch {
      onFeedback?.('Falha de rede ao denunciar.', 'error');
    } finally {
      setReporting(false);
    }
  };

  const handleAdopt = async () => {
    setAdopting(true);
    try {
      const result = await adoptCommunityAdaptationAction(version.id, childProfileId);
      if (!result.ok) {
        onFeedback?.(result.message ?? 'Não foi possível salvar esta versão.', 'error');
        return;
      }
      onFeedback?.(`Versão salva para ${childName}.`, 'success');
      onAdopted?.({ adaptationId: version.id, userStoryId: result.data.userStoryId });
    } catch {
      onFeedback?.('Falha de rede ao salvar.', 'error');
    } finally {
      setAdopting(false);
    }
  };

  return (
    <>
      <div className={cn('flex flex-wrap items-center gap-2', className)}>
        {showReadLink && readHref ? (
          <a
            href={readHref}
            className={cn(
              buttonClass,
              'bg-white text-tinta border border-borda hover:border-laranja/40 focus-visible:ring-laranja'
            )}
          >
            <span className="material-symbols-outlined text-sm">menu_book</span>
            {readLabel}
          </a>
        ) : null}

        {allowVoteAndAdopt ? (
          <>
            <button
              type="button"
              disabled={version.userVote === 1}
              onClick={() => {
                setPendingVote({ adaptationId: version.id, value: 1 });
                setParentGateOpen(true);
              }}
              className={cn(
                buttonClass,
                'text-aprovado bg-aprovado-claro hover:bg-aprovado-claro/80 focus-visible:ring-aprovado'
              )}
            >
              <span className="material-symbols-outlined text-sm">thumb_up</span>
              {version.userVote === 1 ? 'Votou +' : 'Votar +'}
            </button>
            <button
              type="button"
              disabled={version.userVote === -1}
              onClick={() => {
                setPendingVote({ adaptationId: version.id, value: -1 });
                setParentGateOpen(true);
              }}
              className={cn(
                buttonClass,
                'text-oliva bg-pergaminho-escuro hover:bg-pergaminho-escuro/80 focus-visible:ring-oliva'
              )}
            >
              <span className="material-symbols-outlined text-sm">thumb_down</span>
              {version.userVote === -1 ? 'Votou −' : 'Votar −'}
            </button>

            <button
              type="button"
              disabled={adopting}
              onClick={() => void handleAdopt()}
              className={cn(
                buttonClass,
                'text-vida bg-vida/10 hover:bg-vida/15 focus-visible:ring-vida'
              )}
            >
              <span className="material-symbols-outlined text-sm">bookmark_add</span>
              {adopting ? 'Salvando...' : `Usar para ${childName}`}
            </button>
          </>
        ) : null}

        <button
          type="button"
          disabled={reporting}
          onClick={() => void handleReport()}
          className={cn(
            buttonClass,
            'text-oliva hover:text-laranja focus-visible:ring-laranja bg-transparent px-1'
          )}
        >
          <span className="material-symbols-outlined text-sm">flag</span>
          {reporting ? 'Enviando...' : 'Denunciar'}
        </button>
      </div>

      <ParentGateModal
        open={parentGateOpen}
        onClose={() => {
          setParentGateOpen(false);
          setPendingVote(null);
        }}
        onSuccess={() => {
          if (pendingVote) {
            void submitVote(pendingVote.adaptationId, pendingVote.value);
          }
          setPendingVote(null);
        }}
      />
    </>
  );
}
