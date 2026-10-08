import type { AdaptationStatus } from '@prisma/client';

/** Denunciations needed before a community version is auto-withdrawn. */
export const COMMUNITY_REPORT_THRESHOLD = 3;

/** Statuses eligible for story cache reuse by other families. */
export const CACHEABLE_STATUSES: AdaptationStatus[] = ['community', 'as_default'];

/** Statuses visible in community listings and votable by others. */
export const COMMUNITY_VISIBLE_STATUSES: AdaptationStatus[] = ['community', 'as_default'];

/** Statuses awaiting Pedro's manual decision. */
export const MANUAL_REVIEW_STATUSES: AdaptationStatus[] = ['pending_manual_review'];

/** Statuses where automatic moderation is in progress. */
export const AUTO_REVIEW_STATUSES: AdaptationStatus[] = ['pending_review'];

/** Statuses from which a family may start (or retry) community submission. */
export const SUBMITTABLE_STATUSES: AdaptationStatus[] = [
  'draft',
  'family_approved',
  'rejected',
  'withdrawn',
];

/** pending_review without moderatedAt for longer than this may be re-submitted. */
export const STUCK_PENDING_REVIEW_MS = 3 * 60 * 1000;

export const MODERATION_UNAVAILABLE_REASON = 'Moderação automática indisponível.';
export const REVIEW_UNAVAILABLE_REASON = 'Revisão automática indisponível.';
export const UNEXPECTED_REVIEW_ERROR_REASON =
  'Erro inesperado na revisão automática. Revisão manual necessária.';
