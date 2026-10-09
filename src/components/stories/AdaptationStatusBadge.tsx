import type { AdaptationStatus } from '@prisma/client';
import { cn } from '@/lib/cn';
import { getAdaptationStatusLabel } from '@/lib/moderation/status-labels';

interface AdaptationStatusBadgeProps {
  status: AdaptationStatus | string;
  voteScore?: number | null;
  className?: string;
  compact?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-pergaminho-escuro text-oliva border-borda',
  family_approved: 'bg-aprovado-claro text-aprovado border-aprovado/20',
  pending_review: 'bg-ceu-claro text-ceu border-ceu/20',
  pending_manual_review: 'bg-ceu-claro text-ceu border-ceu/20',
  community: 'bg-aprovado-claro text-aprovado border-aprovado/20',
  as_default: 'bg-dourado/15 text-dourado border-dourado/25',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  withdrawn: 'bg-pergaminho-escuro text-oliva border-borda',
};

function getStatusIcon(status: string): string {
  switch (status) {
    case 'as_default':
      return 'star';
    case 'community':
      return 'verified_user';
    case 'family_approved':
      return 'family_restroom';
    case 'pending_review':
    case 'pending_manual_review':
      return 'hourglass_top';
    case 'rejected':
    case 'withdrawn':
      return 'block';
    default:
      return 'edit_note';
  }
}

export function AdaptationStatusBadge({
  status,
  voteScore,
  className,
  compact = false,
}: AdaptationStatusBadgeProps) {
  const label =
    status === 'as_default'
      ? 'Padrão'
      : getAdaptationStatusLabel(status as AdaptationStatus);
  const showScore =
    voteScore != null &&
    voteScore > 0 &&
    (status === 'community' || status === 'as_default' || status === 'family_approved');

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold rounded-xl border shrink-0',
        compact ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1.5',
        STATUS_STYLES[status] ?? STATUS_STYLES.draft,
        className
      )}
    >
      <span className="material-symbols-outlined text-sm">{getStatusIcon(status)}</span>
      <span>{label}</span>
      {showScore ? <span className="opacity-80">({voteScore} ★)</span> : null}
    </div>
  );
}

/** @deprecated Use AdaptationStatusBadge */
export { AdaptationStatusBadge as ApprovalBadge };
