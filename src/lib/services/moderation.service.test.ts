import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdaptationNotFound, DomainError } from '@/lib/domain/errors';
import { ModerationService } from '@/lib/services/moderation.service';
import type { AdaptationContent } from '@/lib/domain/schemas';

const sampleContent: AdaptationContent = {
  pages: [
    {
      paragraphs: [[{ type: 'text', value: 'Jesus morreu por amor a nós e depois voltou à vida.' }]],
    },
  ],
};

describe('ModerationService', () => {
  const adaptations = { findById: vi.fn() };
  const moderation = {
    updateModerationState: vi.fn(),
    createAuditLog: vi.fn(),
    listPendingManualReview: vi.fn(),
    createReport: vi.fn(),
    getReportCount: vi.fn(),
  };
  const contentModeration = { moderate: vi.fn() };
  const storyReview = { review: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function buildService() {
    return new ModerationService(
      adaptations as never,
      moderation as never,
      contentModeration as never,
      storyReview as never
    );
  }

  function mockAdaptation(overrides: Record<string, unknown> = {}) {
    return {
      id: 'adapt-1',
      status: 'draft',
      ageTier: 'TIER_3_5',
      content: sampleContent,
      passage: { reference: 'Mateus 27:32-56', slug: 'mateus-27' },
      ...overrides,
    };
  }

  describe('submitForCommunityReview', () => {
    it('auto-approves when content moderation and LLM review pass', async () => {
      vi.mocked(adaptations.findById).mockResolvedValue(mockAdaptation() as never);
      vi.mocked(contentModeration.moderate).mockResolvedValue({ flagged: false, categories: [] });
      vi.mocked(storyReview.review).mockResolvedValue({
        verdict: 'approved',
        reason: 'Ok.',
        biblicalFidelityOk: true,
        ageAppropriateOk: true,
      });
      vi.mocked(moderation.updateModerationState).mockResolvedValue({ id: 'adapt-1' } as never);

      const outcome = await buildService().submitForCommunityReview('adapt-1', 'user-a');

      expect(moderation.updateModerationState).toHaveBeenCalledWith('adapt-1', {
        status: 'pending_review',
        moderationReason: null,
      });
      expect(outcome.status).toBe('community');
      expect(moderation.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'auto_approved', actorType: 'system' })
      );
    });

    it('rejects when OpenAI moderation flags content', async () => {
      vi.mocked(adaptations.findById).mockResolvedValue(mockAdaptation() as never);
      vi.mocked(contentModeration.moderate).mockResolvedValue({
        flagged: true,
        categories: ['violence'],
      });
      vi.mocked(moderation.updateModerationState).mockResolvedValue({ id: 'adapt-1' } as never);

      const outcome = await buildService().submitForCommunityReview('adapt-1', 'user-a');

      expect(outcome.status).toBe('rejected');
      expect(outcome.reason).toMatch(/3 a 5 anos/i);
      expect(storyReview.review).not.toHaveBeenCalled();
      expect(moderation.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'auto_rejected' })
      );
    });

    it('sends to manual review when LLM is uncertain', async () => {
      vi.mocked(adaptations.findById).mockResolvedValue(mockAdaptation() as never);
      vi.mocked(contentModeration.moderate).mockResolvedValue({ flagged: false, categories: [] });
      vi.mocked(storyReview.review).mockResolvedValue({
        verdict: 'manual_review',
        reason: 'Passagem difícil.',
        biblicalFidelityOk: true,
        ageAppropriateOk: false,
      });
      vi.mocked(moderation.updateModerationState).mockResolvedValue({ id: 'adapt-1' } as never);

      const outcome = await buildService().submitForCommunityReview('adapt-1', 'user-a');

      expect(outcome.status).toBe('pending_manual_review');
      expect(moderation.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'auto_manual_review' })
      );
    });

    it('rejects share from invalid status', async () => {
      vi.mocked(adaptations.findById).mockResolvedValue(
        mockAdaptation({ status: 'community' }) as never
      );

      await expect(
        buildService().submitForCommunityReview('adapt-1', 'user-a')
      ).rejects.toBeInstanceOf(DomainError);
    });
  });

  describe('sensitive passages per tier', () => {
    const cases = [
      { reference: 'Mateus 2:16-18', tier: 'TIER_3_5', text: 'Herodes mandou fazer algo terrível.' },
      { reference: 'Gênesis 7:11-24', tier: 'TIER_6_8', text: 'Veio um grande dilúvio sobre a terra.' },
      { reference: 'Mateus 27:32-56', tier: 'TIER_9_11', text: 'Jesus foi preso, julgado e morreu na cruz.' },
    ] as const;

    it.each(cases)(
      'runs review for $reference at $tier',
      async ({ reference, tier, text }) => {
        vi.mocked(adaptations.findById).mockResolvedValue(
          mockAdaptation({
            ageTier: tier,
            passage: { reference, slug: 'test' },
            content: { pages: [{ paragraphs: [[{ type: 'text', value: text }]] }] },
          }) as never
        );
        vi.mocked(contentModeration.moderate).mockResolvedValue({ flagged: false, categories: [] });
        vi.mocked(storyReview.review).mockResolvedValue({
          verdict: 'approved',
          reason: 'Ok.',
          biblicalFidelityOk: true,
          ageAppropriateOk: true,
        });
        vi.mocked(moderation.updateModerationState).mockResolvedValue({ id: 'adapt-1' } as never);

        await buildService().runAutomaticReview('adapt-1');

        expect(storyReview.review).toHaveBeenCalledWith(
          expect.objectContaining({ reference, storyText: expect.stringContaining(text) })
        );
      }
    );
  });

  describe('reportCommunityVersion', () => {
    it('withdraws after threshold reports', async () => {
      vi.mocked(adaptations.findById).mockResolvedValue(
        mockAdaptation({ status: 'community' }) as never
      );
      vi.mocked(moderation.createReport).mockResolvedValue({ created: true, reportCount: 3 });
      vi.mocked(moderation.updateModerationState).mockResolvedValue({ id: 'adapt-1' } as never);

      const result = await buildService().reportCommunityVersion('user-b', 'adapt-1');

      expect(result.withdrawn).toBe(true);
      expect(moderation.updateModerationState).toHaveBeenCalledWith(
        'adapt-1',
        expect.objectContaining({ status: 'withdrawn' })
      );
    });

    it('rejects reporting non-community versions', async () => {
      vi.mocked(adaptations.findById).mockResolvedValue(
        mockAdaptation({ status: 'draft' }) as never
      );

      await expect(
        buildService().reportCommunityVersion('user-b', 'adapt-1')
      ).rejects.toBeInstanceOf(DomainError);
    });

    it('throws when adaptation missing', async () => {
      vi.mocked(adaptations.findById).mockResolvedValue(null);

      await expect(
        buildService().reportCommunityVersion('user-b', 'missing')
      ).rejects.toBeInstanceOf(AdaptationNotFound);
    });
  });

  describe('admin actions', () => {
    it('adminApprove sets community and logs audit', async () => {
      vi.mocked(adaptations.findById).mockResolvedValue(
        mockAdaptation({ status: 'pending_manual_review' }) as never
      );
      vi.mocked(moderation.updateModerationState).mockResolvedValue({ id: 'adapt-1' } as never);

      await buildService().adminApprove('adapt-1', 'admin-1', 'Aprovado pelo Pedro.');

      expect(moderation.updateModerationState).toHaveBeenCalledWith(
        'adapt-1',
        expect.objectContaining({ status: 'community' })
      );
      expect(moderation.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'admin_approved', actorType: 'admin', actorId: 'admin-1' })
      );
    });
  });
});
