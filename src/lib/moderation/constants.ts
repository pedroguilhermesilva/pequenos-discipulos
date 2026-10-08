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
