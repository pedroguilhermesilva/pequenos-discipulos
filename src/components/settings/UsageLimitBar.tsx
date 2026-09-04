import { cn } from '@/lib/cn';
import type { UsageLimit } from '@/lib/user/usage-limits';

interface UsageLimitBarProps {
  limit: UsageLimit;
}

export function UsageLimitBar({ limit }: UsageLimitBarProps) {
  const isUnlimited = limit.limit === null;
  const percentage = isUnlimited
    ? 0
    : (limit.limit ?? 0) > 0
      ? Math.min(100, Math.round((limit.used / (limit.limit ?? 1)) * 100))
      : 100;
  const isNearLimit = !isUnlimited && limit.limit !== null && limit.used >= limit.limit * 0.8;
  const isAtLimit = !isUnlimited && limit.limit !== null && limit.used >= limit.limit;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-oliva text-xl shrink-0">
            {limit.icon}
          </span>
          <span className="font-semibold text-tinta text-sm truncate">{limit.label}</span>
        </div>
        <span
          className={cn(
            'text-sm font-bold shrink-0',
            isAtLimit ? 'text-dourado' : isNearLimit ? 'text-oliva' : 'text-tinta'
          )}
        >
          {isUnlimited ? (
            <span className="text-vida">Ilimitado</span>
          ) : (
            <>
              {limit.used}
              <span className="text-oliva font-medium"> / {limit.limit}</span>
            </>
          )}
        </span>
      </div>

      <div className="h-2.5 bg-borda/60 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isUnlimited ? 'bg-vida/30 w-full' : limit.colorClass,
            isAtLimit && 'bg-dourado'
          )}
          style={{ width: isUnlimited ? '100%' : `${percentage}%` }}
          role="progressbar"
          aria-valuenow={limit.used}
          aria-valuemin={0}
          aria-valuemax={limit.limit ?? undefined}
          aria-label={`${limit.label}: ${limit.used} de ${isUnlimited ? 'ilimitado' : limit.limit}`}
        />
      </div>
    </div>
  );
}
