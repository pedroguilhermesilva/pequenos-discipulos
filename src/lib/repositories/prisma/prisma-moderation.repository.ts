import type { PrismaClient } from '@prisma/client';
import type {
  ModerationRepository,
  ModerationAuditEntry,
} from '@/lib/repositories/interfaces/moderation.repository';

export class PrismaModerationRepository implements ModerationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  updateModerationState(adaptationId: string, data: Parameters<ModerationRepository['updateModerationState']>[1]) {
    return this.prisma.passageAdaptation.update({
      where: { id: adaptationId },
      data,
    });
  }

  async createAuditLog(entry: ModerationAuditEntry): Promise<void> {
    await this.prisma.moderationAuditLog.create({
      data: {
        adaptationId: entry.adaptationId,
        action: entry.action,
        actorType: entry.actorType,
        actorId: entry.actorId ?? null,
        reason: entry.reason ?? null,
      },
    });
  }

  listPendingManualReview(limit = 50) {
    return this.prisma.passageAdaptation.findMany({
      where: { status: 'pending_manual_review' },
      include: {
        passage: { select: { reference: true, slug: true } },
        createdByUser: { select: { email: true, fullName: true } },
      },
      orderBy: { updatedAt: 'asc' },
      take: limit,
    });
  }

  async createReport(userId: string, adaptationId: string) {
    try {
      await this.prisma.adaptationReport.create({
        data: { userId, adaptationId },
      });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === 'P2002') {
        const reportCount = await this.getReportCount(adaptationId);
        return { created: false, reportCount };
      }
      throw error;
    }

    const updated = await this.prisma.passageAdaptation.update({
      where: { id: adaptationId },
      data: { reportCount: { increment: 1 } },
      select: { reportCount: true },
    });

    return { created: true, reportCount: updated.reportCount };
  }

  async getReportCount(adaptationId: string) {
    const row = await this.prisma.passageAdaptation.findUnique({
      where: { id: adaptationId },
      select: { reportCount: true },
    });
    return row?.reportCount ?? 0;
  }
}
