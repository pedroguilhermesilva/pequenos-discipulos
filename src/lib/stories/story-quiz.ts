import type { AgeTier } from '@/lib/stories/age-tiers';

export type QuizQuestionType = 'choice' | 'reflection';

export type QuizOption = {
  id: string;
  label: string;
  icon: string;
};

export type StoryQuizQuestion = {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  options: QuizOption[];
  /** Present only for choice questions with a preferred answer. */
  correctOptionId?: string;
  encouragementCorrect: string;
  encouragementAlmost: string;
};

export type StoryQuiz = {
  title: string;
  subtitle: string;
  celebrationTitle: string;
  celebrationMessage: string;
  questions: StoryQuizQuestion[];
};

const ESTRELA_QUIZ_BY_TIER: Record<AgeTier, StoryQuiz> = {
  '3-5': {
    title: 'Vamos relembrar juntos?',
    subtitle: 'Toque na resposta que você lembra da história.',
    celebrationTitle: 'Você brilhou!',
    celebrationMessage:
      'A estrela mostrou o caminho até Jesus. Que o amor de Deus brilhe no seu coração também!',
    questions: [
      {
        id: 'q1',
        type: 'choice',
        prompt: 'O que os amigos seguiram no céu?',
        options: [
          { id: 'star', label: 'A estrela', icon: 'star' },
          { id: 'moon', label: 'A lua', icon: 'nightlight' },
          { id: 'cloud', label: 'Uma nuvem', icon: 'cloud' },
        ],
        correctOptionId: 'star',
        encouragementCorrect: 'Isso! A estrela brilhante mostrou o caminho.',
        encouragementAlmost: 'Quase! Foi a estrela que guiou os amigos até Jesus.',
      },
      {
        id: 'q2',
        type: 'choice',
        prompt: 'Quem era o bebezinho especial?',
        options: [
          { id: 'jesus', label: 'Jesus', icon: 'favorite' },
          { id: 'amigo', label: 'Um amigo', icon: 'person' },
          { id: 'rei', label: 'Um rei longe', icon: 'castle' },
        ],
        correctOptionId: 'jesus',
        encouragementCorrect: 'Sim! O bebezinho especial era Jesus.',
        encouragementAlmost: 'Quase! O bebezinho especial era Jesus.',
      },
      {
        id: 'q3',
        type: 'reflection',
        prompt: 'Como o seu coração se sentiu com essa história?',
        options: [
          { id: 'alegre', label: 'Alegre', icon: 'sentiment_very_satisfied' },
          { id: 'calmo', label: 'Calminho', icon: 'sentiment_satisfied' },
          { id: 'amor', label: 'Cheio de amor', icon: 'favorite' },
        ],
        encouragementCorrect: 'Que lindo! Guarde esse sentimento no coração.',
        encouragementAlmost: 'Que lindo! Guarde esse sentimento no coração.',
      },
    ],
  },
  '6-8': {
    title: 'Vamos relembrar juntos?',
    subtitle: 'Responda com carinho — não é prova, é para fixar a história no coração.',
    celebrationTitle: 'Missão cumprida!',
    celebrationMessage:
      'Você lembrou da estrela, dos magos e de Jesus. Que essa luz continue a guiar o seu dia!',
    questions: [
      {
        id: 'q1',
        type: 'choice',
        prompt: 'Quem seguiu a estrela até encontrar Jesus?',
        options: [
          { id: 'magos', label: 'Os magos / três amigos', icon: 'groups' },
          { id: 'herodes', label: 'O rei Herodes', icon: 'account_balance' },
          { id: 'soldados', label: 'Os soldados', icon: 'shield' },
        ],
        correctOptionId: 'magos',
        encouragementCorrect: 'Certo! Os magos seguiram a estrela com alegria.',
        encouragementAlmost: 'Quase! Foram os magos que seguiram a estrela até Jesus.',
      },
      {
        id: 'q2',
        type: 'choice',
        prompt: 'O que a estrela fez pelos viajantes?',
        options: [
          { id: 'guiou', label: 'Mostrou o caminho', icon: 'explore' },
          { id: 'escondeu', label: 'Escondeu Jesus', icon: 'visibility_off' },
          { id: 'apagou', label: 'Apagou a luz', icon: 'bedtime' },
        ],
        correctOptionId: 'guiou',
        encouragementCorrect: 'Isso! A estrela guiou até o lugar onde estava o menino.',
        encouragementAlmost: 'Quase! A estrela mostrou o caminho até Jesus.',
      },
      {
        id: 'q3',
        type: 'reflection',
        prompt: 'Como você pode seguir a luz de Jesus hoje?',
        options: [
          { id: 'amar', label: 'Amando as pessoas', icon: 'volunteer_activism' },
          { id: 'ajudar', label: 'Ajudando em casa', icon: 'home' },
          { id: 'agradecer', label: 'Agradecendo a Deus', icon: 'sunny' },
        ],
        encouragementCorrect: 'Linda escolha! Assim a luz de Jesus brilha em você.',
        encouragementAlmost: 'Linda escolha! Assim a luz de Jesus brilha em você.',
      },
    ],
  },
  '9-11': {
    title: 'Para guardar na cabeça e no coração',
    subtitle: 'Pense com calma. Cada resposta ajuda a história a ficar viva em você.',
    celebrationTitle: 'História guardada!',
    celebrationMessage:
      'Você refletiu sobre a estrela, a adoração e o caminho de volta. Que essa luz continue a orientar as suas escolhas.',
    questions: [
      {
        id: 'q1',
        type: 'choice',
        prompt: 'Por que os magos viajaram até Belém?',
        options: [
          { id: 'adorar', label: 'Para adorar o rei recém-nascido', icon: 'church' },
          { id: 'presente-herodes', label: 'Para levar presentes a Herodes', icon: 'card_giftcard' },
          { id: 'mapa', label: 'Para desenhar um mapa do céu', icon: 'map' },
        ],
        correctOptionId: 'adorar',
        encouragementCorrect: 'Exato! Eles vieram adorar Jesus, o rei dos judeus.',
        encouragementAlmost: 'Quase! Eles vieram adorar o recém-nascido rei dos judeus.',
      },
      {
        id: 'q2',
        type: 'choice',
        prompt: 'Por que os magos voltaram por outro caminho?',
        options: [
          { id: 'aviso', label: 'Foram avisados em sonho para não voltar a Herodes', icon: 'psychology' },
          { id: 'atalho', label: 'Acharam um atalho mais curto', icon: 'alt_route' },
          { id: 'estrela', label: 'A estrela mudou de lugar', icon: 'star' },
        ],
        correctOptionId: 'aviso',
        encouragementCorrect: 'Isso! Um sonho os avisou para proteger Jesus.',
        encouragementAlmost: 'Quase! Eles foram avisados em sonho para não voltar a Herodes.',
      },
      {
        id: 'q3',
        type: 'reflection',
        prompt: 'O que esta história te convida a fazer com o seu coração?',
        options: [
          { id: 'seguir', label: 'Seguir a luz de Jesus', icon: 'wb_sunny' },
          { id: 'adorar', label: 'Adorar com gratidão', icon: 'favorite' },
          { id: 'proteger', label: 'Cuidar do que é precioso', icon: 'health_and_safety' },
        ],
        encouragementCorrect: 'Que belo propósito. Leve isso consigo hoje.',
        encouragementAlmost: 'Que belo propósito. Leve isso consigo hoje.',
      },
    ],
  },
};

export function getStoryQuiz(storyId: string, ageTier: AgeTier): StoryQuiz | null {
  if (storyId === '1') return ESTRELA_QUIZ_BY_TIER[ageTier];
  return null;
}

export function getEncouragement(
  question: StoryQuizQuestion,
  selectedOptionId: string
): string {
  if (question.type === 'reflection' || !question.correctOptionId) {
    return question.encouragementCorrect;
  }

  return selectedOptionId === question.correctOptionId
    ? question.encouragementCorrect
    : question.encouragementAlmost;
}

export function isCorrectChoice(
  question: StoryQuizQuestion,
  selectedOptionId: string
): boolean | null {
  if (question.type === 'reflection' || !question.correctOptionId) return null;
  return selectedOptionId === question.correctOptionId;
}

export type QuizOutcome = 'success' | 'partial' | 'poor';

export type QuizCompletionContent = {
  outcome: QuizOutcome;
  title: string;
  message: string;
  icon: string;
};

/** Only `choice` questions with a correct answer count toward the score. */
export function computeQuizScore(
  questions: StoryQuizQuestion[],
  answers: Record<string, string>
): { correct: number; total: number } {
  let correct = 0;
  let total = 0;

  for (const question of questions) {
    if (question.type !== 'choice' || !question.correctOptionId) continue;
    total += 1;
    if (answers[question.id] === question.correctOptionId) {
      correct += 1;
    }
  }

  return { correct, total };
}

/** All correct → success; none correct → poor; otherwise partial. */
export function getQuizOutcome(correct: number, total: number): QuizOutcome {
  if (total === 0) return 'success';
  if (correct >= total) return 'success';
  if (correct === 0) return 'poor';
  return 'partial';
}

export function getQuizCompletionContent(
  outcome: QuizOutcome,
  quiz: StoryQuiz
): QuizCompletionContent {
  switch (outcome) {
    case 'success':
      return {
        outcome,
        title: quiz.celebrationTitle,
        message: quiz.celebrationMessage,
        icon: 'auto_awesome',
      };
    case 'partial':
      return {
        outcome,
        title: 'Boa tentativa!',
        message:
          'Você acertou algumas respostas. Que tal reler a história com calma? Cada tentativa ajuda a guardar no coração.',
        icon: 'menu_book',
      };
    case 'poor':
      return {
        outcome,
        title: 'Vamos aprender juntos?',
        message:
          'Não desanime! Releia a história com carinho — assim fica mais fácil lembrar. Deus ama quando você tenta aprender.',
        icon: 'lightbulb',
      };
  }
}
