import type { AgeTier as PrismaAgeTier, AdaptationStatus, ContentType } from '@prisma/client';
import type { AgeTier } from '@/lib/stories/age-tiers';
import type { ContentType as AppContentType } from '@/lib/stories/types';

export function toPrismaAgeTier(tier: AgeTier): PrismaAgeTier {
  switch (tier) {
    case '3-5':
      return 'TIER_3_5';
    case '6-8':
      return 'TIER_6_8';
    case '9-11':
      return 'TIER_9_11';
  }
}

export function fromPrismaAgeTier(tier: PrismaAgeTier): AgeTier {
  switch (tier) {
    case 'TIER_3_5':
      return '3-5';
    case 'TIER_6_8':
      return '6-8';
    case 'TIER_9_11':
      return '9-11';
  }
}

export function toPrismaContentType(type: AppContentType): ContentType {
  return type;
}

export function fromPrismaContentType(type: ContentType): AppContentType {
  return type;
}

export function fromPrismaAdaptationStatus(status: AdaptationStatus): string {
  return status;
}
