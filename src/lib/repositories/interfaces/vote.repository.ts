import type { AdaptationVote } from '@prisma/client';

export interface VoteRepository {
  findByUserAndAdaptation(userId: string, adaptationId: string): Promise<AdaptationVote | null>;
  upsert(userId: string, adaptationId: string, value: number): Promise<AdaptationVote>;
  aggregate(adaptationId: string): Promise<{ voteCount: number; voteScore: number }>;
}
