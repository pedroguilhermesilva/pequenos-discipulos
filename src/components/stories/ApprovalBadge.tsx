import { cn } from '@/lib/cn';

interface ApprovalBadgeProps {
  rating?: number;
  className?: string;
}

export function ApprovalBadge({ rating = 4.9, className }: ApprovalBadgeProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 bg-aprovado-claro text-aprovado text-xs font-semibold px-3 py-1.5 rounded-xl border border-aprovado/20 shrink-0',
        className
      )}
    >
      <span className="material-symbols-outlined text-base">verified_user</span>
      <span>Aprovado pelos Pais ({rating} ★)</span>
    </div>
  );
}
