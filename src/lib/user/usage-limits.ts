import type { ContentType } from '@/lib/stories/types';

export type SubscriptionTier = 'free' | 'premium' | 'family';

export interface UsageLimit {
  type: ContentType;
  label: string;
  icon: string;
  used: number;
  limit: number | null;
  colorClass: string;
}

export interface UsageLimitsResult {
  tier: SubscriptionTier;
  tierLabel: string;
  limits: UsageLimit[];
  resetsAt: string;
}

const TIER_LABELS: Record<SubscriptionTier, string> = {
  free: 'Gratuito',
  premium: 'Premium',
  family: 'Família',
};

const TIER_LIMITS: Record<SubscriptionTier, Record<ContentType, number | null>> = {
  free: { text: 10, audio: 3, video: 1 },
  premium: { text: 50, audio: 20, video: 10 },
  family: { text: null, audio: null, video: null },
};

const LIMIT_CONFIG: Record<ContentType, { label: string; icon: string; colorClass: string }> = {
  text: { label: 'Histórias em texto', icon: 'menu_book', colorClass: 'bg-ceu' },
  audio: { label: 'Roteiros de áudio', icon: 'headphones', colorClass: 'bg-dourado' },
  video: { label: 'Vídeos', icon: 'play_circle', colorClass: 'bg-laranja' },
};

export function getNextResetDate(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return next.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function buildUsageLimits(
  tier: SubscriptionTier,
  usage: Record<ContentType, number>
): UsageLimitsResult {
  const tierLimits = TIER_LIMITS[tier] ?? TIER_LIMITS.free;

  const limits: UsageLimit[] = (['text', 'audio', 'video'] as ContentType[]).map((type) => {
    const config = LIMIT_CONFIG[type];
    return {
      type,
      label: config.label,
      icon: config.icon,
      used: usage[type],
      limit: tierLimits[type],
      colorClass: config.colorClass,
    };
  });

  return {
    tier,
    tierLabel: TIER_LABELS[tier] ?? TIER_LABELS.free,
    limits,
    resetsAt: getNextResetDate(),
  };
}
