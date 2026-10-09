'use client';

import Link from 'next/link';
import { AdaptationStatusBadge } from '@/components/stories/AdaptationStatusBadge';
import { CommunityVersionActions } from '@/components/community/CommunityVersionActions';
import type { CommunityBrowseItem } from '@/lib/services/community-browse.service';
import { cn } from '@/lib/cn';

interface CommunityVersionCardProps {
  item: CommunityBrowseItem;
  childName?: string;
  childProfileId?: string;
  onItemChange: (id: string, patch: Partial<CommunityBrowseItem>) => void;
  onRemove: (id: string) => void;
  onFeedback: (message: string, variant: 'success' | 'error') => void;
}

export function CommunityVersionCard({
  item,
  childName,
  childProfileId,
  onItemChange,
  onRemove,
  onFeedback,
}: CommunityVersionCardProps) {
  const readHref = `/comunidade/versao/${item.id}`;

  return (
    <article
      className={cn(
        'bg-white rounded-livro-xl border border-borda shadow-sm p-5 flex flex-col gap-3',
        'hover:border-laranja/25 transition-colors'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <Link
            href={readHref}
            className="font-display font-bold text-tinta text-lg leading-snug hover:text-laranja transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja rounded"
          >
            {item.title}
          </Link>
          <p className="text-sm text-laranja font-semibold">{item.passageReference}</p>
          <p className="text-xs text-oliva">{item.ageTierLabel}</p>
        </div>
        <AdaptationStatusBadge status={item.status} voteScore={item.voteScore} compact />
      </div>

      <p className="text-sm text-oliva line-clamp-3">{item.excerpt}</p>

      <div className="flex items-center gap-2 text-sm font-bold text-tinta">
        <span className="text-laranja">★ {item.voteScore}</span>
        <span className="text-oliva font-normal text-xs">
          ({item.voteCount} {item.voteCount === 1 ? 'voto' : 'votos'})
        </span>
      </div>

      <CommunityVersionActions
        version={item}
        childName={childName}
        childProfileId={childProfileId}
        size="md"
        showReadLink
        readHref={readHref}
        readLabel="Ler versão"
        onFeedback={onFeedback}
        onVoteSuccess={({ adaptationId, voteScore, voteCount, value }) => {
          onItemChange(adaptationId, { voteScore, voteCount, userVote: value });
        }}
        onReportSuccess={() => onRemove(item.id)}
      />
    </article>
  );
}
