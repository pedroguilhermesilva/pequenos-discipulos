'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import {
  computeQuizScore,
  getEncouragement,
  getQuizCompletionContent,
  getQuizOutcome,
  isCorrectChoice,
  type QuizCompletionContent,
  type StoryQuiz,
  type StoryQuizQuestion,
} from '@/lib/stories/story-quiz';

interface StoryQuizSectionProps {
  quiz: StoryQuiz;
}

export function StoryQuizSection({ quiz }: StoryQuizSectionProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completionContent, setCompletionContent] = useState<QuizCompletionContent | null>(
    null
  );

  useEffect(() => {
    setStepIndex(0);
    setSelectedOptionId(null);
    setRevealed(false);
    setCompleted(false);
    setAnswers({});
    setCompletionContent(null);
  }, [quiz]);

  const question = quiz.questions[stepIndex];
  const total = quiz.questions.length;
  const encouragement =
    question && selectedOptionId ? getEncouragement(question, selectedOptionId) : null;
  const correctness =
    question && selectedOptionId ? isCorrectChoice(question, selectedOptionId) : null;

  const handleSelect = (optionId: string) => {
    if (revealed || completed) return;
    setSelectedOptionId(optionId);
    setRevealed(true);
  };

  const handleContinue = () => {
    if (!revealed || !question || !selectedOptionId) return;

    const nextAnswers = { ...answers, [question.id]: selectedOptionId };

    if (stepIndex >= total - 1) {
      const score = computeQuizScore(quiz.questions, nextAnswers);
      const outcome = getQuizOutcome(score.correct, score.total);
      setAnswers(nextAnswers);
      setCompletionContent(getQuizCompletionContent(outcome, quiz));
      setCompleted(true);
      return;
    }

    setAnswers(nextAnswers);
    setStepIndex((i) => i + 1);
    setSelectedOptionId(null);
    setRevealed(false);
  };

  if (completed && completionContent) {
    return <QuizCompletionScreen content={completionContent} />;
  }

  if (!question) return null;

  return (
    <section className="mt-8 w-full rounded-livro-xl border border-borda bg-pergaminho-escuro/50 p-5 md:p-7 animate-fade-in">
      <header className="mb-5 text-center md:text-left">
        <p className="text-xs font-bold uppercase tracking-wide text-laranja mb-1">
          Para a cabeça e o coração
        </p>
        <h3 className="font-display font-bold text-lg md:text-xl text-tinta">{quiz.title}</h3>
        <p className="text-sm text-oliva mt-1">{quiz.subtitle}</p>
      </header>

      <div className="mb-4 flex items-center gap-3">
        <span className="text-xs font-semibold text-oliva shrink-0">
          Pergunta {stepIndex + 1} de {total}
        </span>
        <div className="flex-1 h-1.5 bg-borda/70 rounded-full overflow-hidden" aria-hidden="true">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber to-laranja transition-all duration-500"
            style={{ width: `${((stepIndex + (revealed ? 1 : 0)) / total) * 100}%` }}
          />
        </div>
      </div>

      <QuizQuestionCard
        question={question}
        selectedOptionId={selectedOptionId}
        revealed={revealed}
        onSelect={handleSelect}
      />

      {revealed && encouragement && (
        <div
          className={cn(
            'mt-4 rounded-livro border px-4 py-3 text-sm font-medium animate-fade-in',
            correctness === false
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-vida/25 bg-laranja-suave text-vida-dark'
          )}
          role="status"
        >
          <span className="inline-flex items-center gap-2">
            <span
              className="material-symbols-outlined text-lg shrink-0"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              {correctness === false ? 'lightbulb' : 'favorite'}
            </span>
            {encouragement}
          </span>
        </div>
      )}

      {revealed && (
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={handleContinue} className="btn-primary px-5 py-2.5 text-sm">
            {stepIndex >= total - 1 ? 'Concluir' : 'Próxima pergunta'}
            <span className="material-symbols-outlined text-base" aria-hidden="true">
              arrow_forward
            </span>
          </button>
        </div>
      )}
    </section>
  );
}

const COMPLETION_STYLES = {
  success: {
    section:
      'border-amber/25 bg-gradient-to-br from-laranja-suave via-aprovado-claro/60 to-ceu-claro/40',
    icon: 'text-amber',
    filled: true,
  },
  partial: {
    section: 'border-laranja/25 bg-laranja-suave',
    icon: 'text-laranja',
    filled: true,
  },
  poor: {
    section: 'border-red-200 bg-red-50',
    icon: 'text-red-600',
    filled: false,
  },
} as const;

function QuizCompletionScreen({ content }: { content: QuizCompletionContent }) {
  const styles = COMPLETION_STYLES[content.outcome];

  return (
    <section
      className={cn(
        'mt-8 w-full rounded-livro-xl border p-6 md:p-8 text-center animate-fade-in',
        styles.section
      )}
      aria-live="polite"
    >
      <span
        className={cn('material-symbols-outlined text-5xl mb-3 inline-block', styles.icon)}
        style={styles.filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
        aria-hidden="true"
      >
        {content.icon}
      </span>
      <h3 className="font-display font-bold text-xl md:text-2xl text-tinta mb-2">
        {content.title}
      </h3>
      <p
        className={cn(
          'text-sm md:text-base max-w-md mx-auto leading-relaxed',
          content.outcome === 'poor' ? 'text-red-700' : 'text-oliva'
        )}
      >
        {content.message}
      </p>
    </section>
  );
}

function QuizQuestionCard({
  question,
  selectedOptionId,
  revealed,
  onSelect,
}: {
  question: StoryQuizQuestion;
  selectedOptionId: string | null;
  revealed: boolean;
  onSelect: (optionId: string) => void;
}) {
  return (
    <div key={question.id} className="animate-slide-in-right">
      <p className="font-display font-semibold text-base md:text-lg text-tinta mb-4">
        {question.prompt}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {question.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          const isCorrect = question.correctOptionId === option.id;
          const showAsCorrect = revealed && question.type === 'choice' && isCorrect;
          const showAsMiss = revealed && isSelected && question.type === 'choice' && !isCorrect;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              disabled={revealed}
              aria-pressed={isSelected}
              className={cn(
                'flex flex-col items-center justify-center gap-2 p-4 rounded-livro border-2 text-center transition-all',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja focus-visible:ring-offset-2',
                !revealed &&
                  'border-borda bg-white hover:border-laranja/50 hover:bg-laranja-suave/60 active:scale-[0.98]',
                revealed && !isSelected && !showAsCorrect && 'border-borda/60 bg-white/70 opacity-60',
                isSelected && !revealed && 'border-laranja bg-laranja-suave shadow-livro',
                showAsCorrect && 'border-vida bg-laranja-suave shadow-livro',
                showAsMiss && 'border-red-400 bg-red-50 shadow-livro',
                revealed && 'cursor-default'
              )}
            >
              <span
                className={cn(
                  'material-symbols-outlined text-3xl',
                  showAsCorrect || (isSelected && question.type === 'reflection')
                    ? 'text-laranja'
                    : showAsMiss
                      ? 'text-red-600'
                      : 'text-oliva'
                )}
                style={
                  showAsCorrect || (isSelected && question.type === 'reflection')
                    ? { fontVariationSettings: "'FILL' 1" }
                    : undefined
                }
                aria-hidden="true"
              >
                {option.icon}
              </span>
              <span className="text-sm font-bold text-tinta leading-snug">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
