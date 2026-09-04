import { AdaptationNotFound } from '@/lib/domain/errors';
import { storyQuizSchema, type StoryQuizData } from '@/lib/domain/schemas';
import type { AdaptationRepository } from '@/lib/repositories/interfaces/adaptation.repository';

export class QuizService {
  constructor(private readonly adaptations: AdaptationRepository) {}

  async getQuiz(adaptationId: string): Promise<StoryQuizData | null> {
    const adaptation = await this.adaptations.findById(adaptationId);
    if (!adaptation) throw new AdaptationNotFound();

    if (!adaptation.quiz) return null;
    const parsed = storyQuizSchema.safeParse(adaptation.quiz);
    return parsed.success ? parsed.data : null;
  }
}
