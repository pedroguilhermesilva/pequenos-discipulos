import type { AdaptationStatus } from '@prisma/client';
import { STUCK_PENDING_REVIEW_MS, SUBMITTABLE_STATUSES } from '@/lib/moderation/constants';

type AdaptationSubmissionState = {
  status: AdaptationStatus;
  moderatedAt: Date | null;
  updatedAt: Date;
};

export function isStuckPendingReview(adaptation: AdaptationSubmissionState): boolean {
  if (adaptation.status !== 'pending_review' || adaptation.moderatedAt !== null) {
    return false;
  }
  return Date.now() - adaptation.updatedAt.getTime() > STUCK_PENDING_REVIEW_MS;
}

export function canSubmitForCommunityReview(adaptation: AdaptationSubmissionState): boolean {
  if (SUBMITTABLE_STATUSES.includes(adaptation.status)) {
    return true;
  }
  return isStuckPendingReview(adaptation);
}
