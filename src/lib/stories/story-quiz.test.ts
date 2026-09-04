import { describe, expect, it } from 'vitest';
import {
  computeQuizScore,
  getQuizCompletionContent,
  getQuizOutcome,
  getStoryQuiz,
} from './story-quiz';

describe('computeQuizScore', () => {
  const quiz = getStoryQuiz('1', '3-5')!;

  it('counts only choice questions toward the total', () => {
    const score = computeQuizScore(quiz.questions, {});
    expect(score.total).toBe(2);
    expect(score.correct).toBe(0);
  });

  it('tracks correct choice answers', () => {
    const score = computeQuizScore(quiz.questions, {
      q1: 'star',
      q2: 'jesus',
      q3: 'alegre',
    });
    expect(score).toEqual({ correct: 2, total: 2 });
  });

  it('ignores reflection answers in scoring', () => {
    const score = computeQuizScore(quiz.questions, {
      q1: 'moon',
      q2: 'amigo',
      q3: 'alegre',
    });
    expect(score).toEqual({ correct: 0, total: 2 });
  });
});

describe('getQuizOutcome', () => {
  it('returns success when all scored questions are correct', () => {
    expect(getQuizOutcome(2, 2)).toBe('success');
  });

  it('returns poor when no scored questions are correct', () => {
    expect(getQuizOutcome(0, 2)).toBe('poor');
  });

  it('returns partial for mixed results', () => {
    expect(getQuizOutcome(1, 2)).toBe('partial');
  });

  it('returns success when there are no scored questions', () => {
    expect(getQuizOutcome(0, 0)).toBe('success');
  });
});

describe('getQuizCompletionContent', () => {
  const quiz = getStoryQuiz('1', '3-5')!;

  it('uses quiz celebration copy for success', () => {
    const content = getQuizCompletionContent('success', quiz);
    expect(content.title).toBe(quiz.celebrationTitle);
    expect(content.message).toBe(quiz.celebrationMessage);
    expect(content.icon).toBe('auto_awesome');
  });

  it('uses learning-focused copy for poor performance', () => {
    const content = getQuizCompletionContent('poor', quiz);
    expect(content.title).toBe('Vamos aprender juntos?');
    expect(content.icon).toBe('lightbulb');
  });
});
