import type {
  AdaptationStatus,
  ModerationAuditAction,
  ModerationActorType,
  PassageAdaptation,
} from '@prisma/client';

export type ModerationAuditEntry = {
  adaptationId: string;
  action: ModerationAuditAction;
  actorType: ModerationActorType;
  actorId?: string | null;
  reason?: string | null;
};

export interface ModerationRepository {
  updateModerationState(
    adaptationId: string,
    data: {
      status: AdaptationStatus;
      moderationReason?: string | null;
      moderatedAt?: Date;
    }
  ): Promise<PassageAdaptation>;

  createAuditLog(entry: ModerationAuditEntry): Promise<void>;

  listPendingManualReview(limit?: number): Promise<
    Array<
      PassageAdaptation & {
        passage: { reference: string; slug: string };
        createdByUser: { email: string | null; fullName: string | null } | null;
      }
    >
  >;

  createReport(userId: string, adaptationId: string): Promise<{ created: boolean; reportCount: number }>;

  getReportCount(adaptationId: string): Promise<number>;
}
