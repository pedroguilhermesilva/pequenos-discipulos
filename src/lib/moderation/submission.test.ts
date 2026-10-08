import { describe, expect, it, vi, afterEach } from 'vitest';
import { STUCK_PENDING_REVIEW_MS } from '@/lib/moderation/constants';
import {
  canSubmitForCommunityReview,
  isStuckPendingReview,
} from '@/lib/moderation/submission';

describe('community submission eligibility', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows draft and family_approved', () => {
    expect(
      canSubmitForCommunityReview({
        status: 'draft',
        moderatedAt: null,
        updatedAt: new Date(),
      })
    ).toBe(true);
    expect(
      canSubmitForCommunityReview({
        status: 'family_approved',
        moderatedAt: null,
        updatedAt: new Date(),
      })
    ).toBe(true);
  });

  it('blocks fresh pending_review', () => {
    expect(
      canSubmitForCommunityReview({
        status: 'pending_review',
        moderatedAt: null,
        updatedAt: new Date(),
      })
    ).toBe(false);
  });

  it('allows stuck pending_review after timeout', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));

    const updatedAt = new Date('2026-01-01T11:00:00Z');
    const adaptation = {
      status: 'pending_review' as const,
      moderatedAt: null,
      updatedAt,
    };

    expect(isStuckPendingReview(adaptation)).toBe(true);
    expect(canSubmitForCommunityReview(adaptation)).toBe(true);
  });

  it('does not treat pending_review with moderatedAt as stuck', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:10:00Z'));

    expect(
      isStuckPendingReview({
        status: 'pending_review',
        moderatedAt: new Date('2026-01-01T11:00:00Z'),
        updatedAt: new Date('2026-01-01T11:00:00Z'),
      })
    ).toBe(false);
  });

  it('does not treat recent pending_review as stuck', () => {
    vi.useFakeTimers();
    const now = new Date('2026-01-01T12:00:00Z');
    vi.setSystemTime(now);

    expect(
      isStuckPendingReview({
        status: 'pending_review',
        moderatedAt: null,
        updatedAt: new Date(now.getTime() - STUCK_PENDING_REVIEW_MS + 60_000),
      })
    ).toBe(false);
  });
});
