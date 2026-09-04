import type { ContentType, PrismaClient, UsageEvent } from '@prisma/client';
import type { UsageRepository } from '@/lib/repositories/interfaces/usage.repository';

export class PrismaUsageRepository implements UsageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getMonthUsage(userId: string, month: string): Promise<Record<ContentType, number>> {
    const rows = await this.prisma.usageEvent.findMany({ where: { userId, month } });
    const counts: Record<ContentType, number> = { text: 0, audio: 0, video: 0 };
    for (const row of rows) {
      counts[row.contentType] = row.count;
    }
    return counts;
  }

  increment(userId: string, contentType: ContentType, month: string): Promise<UsageEvent> {
    return this.prisma.usageEvent.upsert({
      where: {
        userId_contentType_month: { userId, contentType, month },
      },
      update: { count: { increment: 1 } },
      create: { userId, contentType, month, count: 1 },
    });
  }
}
