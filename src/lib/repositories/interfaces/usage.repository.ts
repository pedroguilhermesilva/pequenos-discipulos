import type { ContentType, UsageEvent } from '@prisma/client';

export interface UsageRepository {
  getMonthUsage(userId: string, month: string): Promise<Record<ContentType, number>>;
  increment(userId: string, contentType: ContentType, month: string): Promise<UsageEvent>;
}
