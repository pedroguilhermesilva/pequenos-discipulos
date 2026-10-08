import { describe, expect, it } from 'vitest';
import {
  buildStoryReviewUserPrompt,
  parseStoryReviewResponse,
} from '@/lib/llm/story-moderation.prompt';

describe('story-moderation.prompt', () => {
  it('includes age-tier rules in review user prompt', () => {
    const prompt = buildStoryReviewUserPrompt({
      reference: 'Mateus 27:32-56',
      ageTier: '3-5',
      storyText: 'Jesus morreu por amor a nós.',
    });
    expect(prompt).toMatch(/3 a 5 anos/i);
    expect(prompt).toMatch(/Não pode/i);
    expect(prompt).toMatch(/Mateus 27:32-56/);
  });

  it('parses valid review JSON', () => {
    const parsed = parseStoryReviewResponse(
      JSON.stringify({
        verdict: 'rejected',
        reason: 'Detalhes fortes demais para 3 a 5 anos.',
        biblicalFidelityOk: true,
        ageAppropriateOk: false,
      })
    );
    expect(parsed.verdict).toBe('rejected');
    expect(parsed.ageAppropriateOk).toBe(false);
  });
});
