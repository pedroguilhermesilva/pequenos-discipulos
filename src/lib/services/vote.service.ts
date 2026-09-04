import { AdaptationNotFound, DomainError } from '@/lib/domain/errors';
import type { AdaptationRepository } from '@/lib/repositories/interfaces/adaptation.repository';
import type { VoteRepository } from '@/lib/repositories/interfaces/vote.repository';

export class VoteService {
  constructor(
    private readonly votes: VoteRepository,
    private readonly adaptations: AdaptationRepository
  ) {}

  /**
   * Parent-gate must be validated by the caller before invoking this method.
   */
  async vote(userId: string, adaptationId: string, value: 1 | -1) {
    const adaptation = await this.adaptations.findById(adaptationId);
    if (!adaptation) throw new AdaptationNotFound();

    if (value !== 1 && value !== -1) {
      throw new DomainError('VALIDATION_ERROR', 'Voto inválido.');
    }

    await this.votes.upsert(userId, adaptationId, value);
    const { voteCount, voteScore } = await this.votes.aggregate(adaptationId);
    const updated = await this.adaptations.updateVotes(adaptationId, voteScore, voteCount);

    if (voteCount >= 3 && voteScore >= 4 && updated.status === 'family_approved') {
      await this.adaptations.updateStatus(adaptationId, 'community');
    }

    return { voteCount, voteScore };
  }

  async approveWithFamily(adaptationId: string) {
    const adaptation = await this.adaptations.findById(adaptationId);
    if (!adaptation) throw new AdaptationNotFound();
    return this.adaptations.updateStatus(adaptationId, 'family_approved');
  }

  async shareWithCommunity(adaptationId: string) {
    const adaptation = await this.adaptations.findById(adaptationId);
    if (!adaptation) throw new AdaptationNotFound();
    return this.adaptations.updateStatus(adaptationId, 'community');
  }

  async listCommunityVersions(adaptationId: string) {
    const adaptation = await this.adaptations.findById(adaptationId);
    if (!adaptation) throw new AdaptationNotFound();

    return this.adaptations.listCommunityVersions({
      passageId: adaptation.passageId,
      ageTier: adaptation.ageTier,
      bibleVersionId: adaptation.bibleVersionId,
      verseFrom: adaptation.verseFrom,
      verseTo: adaptation.verseTo,
    });
  }
}
