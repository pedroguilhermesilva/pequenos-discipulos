import type { AdaptationVote, PrismaClient } from '@prisma/client';
import type { VoteRepository } from '@/lib/repositories/interfaces/vote.repository';

export class PrismaVoteRepository implements VoteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByUserAndAdaptation(userId: string, adaptationId: string): Promise<AdaptationVote | null> {
    return this.prisma.adaptationVote.findUnique({
      where: { userId_adaptationId: { userId, adaptationId } },
    });
  }

  upsert(userId: string, adaptationId: string, value: number): Promise<AdaptationVote> {
    return this.prisma.adaptationVote.upsert({
      where: { userId_adaptationId: { userId, adaptationId } },
      update: { value },
      create: { userId, adaptationId, value },
    });
  }

  async aggregate(adaptationId: string): Promise<{ voteCount: number; voteScore: number }> {
    const votes = await this.prisma.adaptationVote.findMany({ where: { adaptationId } });
    const voteCount = votes.length;
    if (voteCount === 0) return { voteCount: 0, voteScore: 0 };

    const sum = votes.reduce((acc, v) => acc + v.value, 0);
    // Map -1/1 votes to a 1–5 style score for the badge UI
    const avg = sum / voteCount;
    const voteScore = Number((((avg + 1) / 2) * 4 + 1).toFixed(1));
    return { voteCount, voteScore };
  }
}
