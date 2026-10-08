import type { AdaptationStatus, AgeTier as PrismaAgeTier } from '@prisma/client';
import { AdaptationNotFound, DomainError } from '@/lib/domain/errors';
import { fromPrismaAgeTier } from '@/lib/domain/mappers';
import type { AdaptationContent } from '@/lib/domain/schemas';
import type { StoryReviewVerdict } from '@/lib/llm/story-moderation.prompt';
import {
  COMMUNITY_REPORT_THRESHOLD,
  MODERATION_UNAVAILABLE_REASON,
  REVIEW_UNAVAILABLE_REASON,
  UNEXPECTED_REVIEW_ERROR_REASON,
} from '@/lib/moderation/constants';
import { canSubmitForCommunityReview } from '@/lib/moderation/submission';
import type { AdaptationRepository } from '@/lib/repositories/interfaces/adaptation.repository';
import type { ModerationRepository } from '@/lib/repositories/interfaces/moderation.repository';
import type { ContentModerationProvider } from '@/lib/providers/interfaces/content-moderation.provider';
import type { StoryReviewProvider } from '@/lib/providers/interfaces/story-review.provider';
import { extractStoryNarrationText } from '@/lib/stories/page-plain-text';

export type ModerationOutcome = {
  status: AdaptationStatus;
  reason: string | null;
  verdict: StoryReviewVerdict | 'content_flagged';
};

function rejectionReasonForAgeTier(ageTier: PrismaAgeTier): string {
  switch (ageTier) {
    case 'TIER_3_5':
      return 'Essa versão tem detalhes fortes demais para 3 a 5 anos.';
    case 'TIER_6_8':
      return 'Essa versão tem detalhes fortes demais para 6 a 8 anos.';
    case 'TIER_9_11':
      return 'Essa versão tem detalhes fortes demais para 9 a 11 anos.';
    default:
      return 'Essa versão não está adequada para a idade indicada.';
  }
}

export class ModerationService {
  constructor(
    private readonly adaptations: AdaptationRepository,
    private readonly moderation: ModerationRepository,
    private readonly contentModeration: ContentModerationProvider,
    private readonly storyReview: StoryReviewProvider
  ) {}

  async submitForCommunityReview(adaptationId: string, actorUserId: string) {
    const adaptation = await this.adaptations.findById(adaptationId);
    if (!adaptation) throw new AdaptationNotFound();

    if (!canSubmitForCommunityReview(adaptation)) {
      throw new DomainError(
        'VALIDATION_ERROR',
        'Esta versão não pode ser enviada para revisão agora.'
      );
    }

    await this.moderation.updateModerationState(adaptationId, {
      status: 'pending_review',
      moderationReason: null,
    });

    try {
      const outcome = await this.runAutomaticReview(adaptationId);
      await this.recordAutomaticReviewAudit(adaptationId, outcome);
      return outcome;
    } catch (error) {
      console.error('[ModerationService] submitForCommunityReview failed', error);
      const outcome = await this.fallbackToManualReview(
        adaptationId,
        UNEXPECTED_REVIEW_ERROR_REASON
      );
      await this.recordAutomaticReviewAudit(adaptationId, outcome);
      return outcome;
    }
  }

  async runAutomaticReview(adaptationId: string): Promise<ModerationOutcome> {
    const adaptation = await this.adaptations.findById(adaptationId);
    if (!adaptation) throw new AdaptationNotFound();

    const content = adaptation.content as AdaptationContent;
    const storyText = extractStoryNarrationText(content).fullText;
    const reference = adaptation.passage.reference;
    const ageTier = fromPrismaAgeTier(adaptation.ageTier);

    let moderation;
    try {
      moderation = await this.contentModeration.moderate(storyText);
    } catch (error) {
      console.error('[ModerationService] content moderation failed', error);
      return this.fallbackToManualReview(adaptationId, MODERATION_UNAVAILABLE_REASON);
    }

    if (moderation.flagged) {
      const reason = rejectionReasonForAgeTier(adaptation.ageTier);
      await this.moderation.updateModerationState(adaptationId, {
        status: 'rejected',
        moderationReason: reason,
        moderatedAt: new Date(),
      });
      return { status: 'rejected', reason, verdict: 'content_flagged' };
    }

    let review;
    try {
      review = await this.storyReview.review({ reference, ageTier, storyText });
    } catch (error) {
      console.error('[ModerationService] LLM story review failed', error);
      return this.fallbackToManualReview(adaptationId, REVIEW_UNAVAILABLE_REASON);
    }

    let status: AdaptationStatus;
    let reason: string | null = review.reason;

    if (review.verdict === 'approved') {
      status = 'community';
      reason = null;
    } else if (review.verdict === 'rejected') {
      status = 'rejected';
      reason = review.reason || rejectionReasonForAgeTier(adaptation.ageTier);
    } else {
      status = 'pending_manual_review';
    }

    await this.moderation.updateModerationState(adaptationId, {
      status,
      moderationReason: reason,
      moderatedAt: new Date(),
    });

    return { status, reason, verdict: review.verdict };
  }

  async adminApprove(adaptationId: string, adminUserId: string, reason?: string) {
    await this.applyAdminDecision(adaptationId, adminUserId, 'community', 'admin_approved', reason);
  }

  async adminReject(adaptationId: string, adminUserId: string, reason: string) {
    await this.applyAdminDecision(adaptationId, adminUserId, 'rejected', 'admin_rejected', reason);
  }

  async adminWithdraw(adaptationId: string, adminUserId: string, reason: string) {
    await this.applyAdminDecision(adaptationId, adminUserId, 'withdrawn', 'admin_withdrawn', reason);
  }

  async listPendingManualReview() {
    return this.moderation.listPendingManualReview();
  }

  async reportCommunityVersion(userId: string, adaptationId: string) {
    const adaptation = await this.adaptations.findById(adaptationId);
    if (!adaptation) throw new AdaptationNotFound();

    if (adaptation.status !== 'community' && adaptation.status !== 'as_default') {
      throw new DomainError('VALIDATION_ERROR', 'Só é possível denunciar versões da comunidade.');
    }

    const { created, reportCount } = await this.moderation.createReport(userId, adaptationId);

    if (created && reportCount >= COMMUNITY_REPORT_THRESHOLD) {
      const reason = `Retirada automaticamente após ${COMMUNITY_REPORT_THRESHOLD} denúncias.`;
      await this.moderation.updateModerationState(adaptationId, {
        status: 'withdrawn',
        moderationReason: reason,
        moderatedAt: new Date(),
      });
      await this.moderation.createAuditLog({
        adaptationId,
        action: 'report_withdrawn',
        actorType: 'system',
        actorId: userId,
        reason,
      });
      return { reportCount, withdrawn: true };
    }

    return { reportCount, withdrawn: false };
  }

  private async fallbackToManualReview(
    adaptationId: string,
    reason: string
  ): Promise<ModerationOutcome> {
    await this.moderation.updateModerationState(adaptationId, {
      status: 'pending_manual_review',
      moderationReason: reason,
      moderatedAt: new Date(),
    });
    return { status: 'pending_manual_review', reason, verdict: 'manual_review' };
  }

  private async recordAutomaticReviewAudit(adaptationId: string, outcome: ModerationOutcome) {
    await this.moderation.createAuditLog({
      adaptationId,
      action:
        outcome.verdict === 'approved'
          ? 'auto_approved'
          : outcome.verdict === 'rejected' || outcome.verdict === 'content_flagged'
            ? 'auto_rejected'
            : 'auto_manual_review',
      actorType: 'system',
      actorId: null,
      reason: outcome.reason,
    });
  }

  private async applyAdminDecision(
    adaptationId: string,
    adminUserId: string,
    status: AdaptationStatus,
    action: 'admin_approved' | 'admin_rejected' | 'admin_withdrawn',
    reason?: string
  ) {
    const adaptation = await this.adaptations.findById(adaptationId);
    if (!adaptation) throw new AdaptationNotFound();

    await this.moderation.updateModerationState(adaptationId, {
      status,
      moderationReason: reason ?? null,
      moderatedAt: new Date(),
    });

    await this.moderation.createAuditLog({
      adaptationId,
      action,
      actorType: 'admin',
      actorId: adminUserId,
      reason: reason ?? null,
    });
  }
}
