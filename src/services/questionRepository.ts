import { STATIC_QUESTION_BANKS } from '../data/questions';
import type {
  OverallStats,
  PersistedAppState,
  Question,
  SubjectStats,
} from '../types/exam';

/**
 * Resolves the active question list for a given subject by combining
 * built-in static JSON banks with any imported runtime question banks.
 */
export function getQuestionsBySubject(
  state: PersistedAppState,
  subjectId: string
): Question[] {
  const staticList = STATIC_QUESTION_BANKS[subjectId] ?? [];
  const customList = state.customQuestions[subjectId] ?? [];
  const hidePlaceholders = Boolean(state.hidePlaceholdersBySubject[subjectId]);

  const filteredStatic = hidePlaceholders
    ? staticList.filter((q) => !q.isPlaceholder)
    : staticList;

  // Deduplicate by ID, preferring imported custom questions when IDs collide
  const mergedMap = new Map<string, Question>();
  for (const q of filteredStatic) {
    mergedMap.set(q.id, q);
  }
  for (const q of customList) {
    mergedMap.set(q.id, { ...q, subjectId });
  }

  return Array.from(mergedMap.values());
}

export function getAllQuestions(state: PersistedAppState): Question[] {
  return state.subjects.flatMap((subject) => getQuestionsBySubject(state, subject.id));
}

export function computeSubjectStats(
  state: PersistedAppState,
  subjectId: string
): SubjectStats {
  const questions = getQuestionsBySubject(state, subjectId);
  const totalQuestions = questions.length;
  let completedQuestions = 0;
  let correctAnswers = 0;
  let incorrectAnswers = 0;
  let unverifiedQuestions = 0;
  let placeholderCount = 0;

  for (const question of questions) {
    if (question.needsVerification || question.correctAnswer === null) {
      unverifiedQuestions += 1;
    }
    if (question.isPlaceholder) {
      placeholderCount += 1;
    }

    const progress = state.questionProgress[question.id];
    if (progress) {
      completedQuestions += 1;
      if (progress.isCorrect === true) {
        correctAnswers += 1;
      } else if (progress.isCorrect === false) {
        incorrectAnswers += 1;
      }
    }
  }

  const gradedCompleted = correctAnswers + incorrectAnswers;
  const progressPercent =
    totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0;
  const accuracyPercent =
    gradedCompleted > 0 ? Math.round((correctAnswers / gradedCompleted) * 100) : 0;

  return {
    subjectId,
    totalQuestions,
    completedQuestions,
    correctAnswers,
    incorrectAnswers,
    unverifiedQuestions,
    placeholderCount,
    progressPercent,
    accuracyPercent,
  };
}

export function computeOverallStats(state: PersistedAppState): OverallStats {
  let totalQuestions = 0;
  let completedQuestions = 0;
  let correctAnswers = 0;
  let incorrectAnswers = 0;

  for (const subject of state.subjects) {
    const stats = computeSubjectStats(state, subject.id);
    totalQuestions += stats.totalQuestions;
    completedQuestions += stats.completedQuestions;
    correctAnswers += stats.correctAnswers;
    incorrectAnswers += stats.incorrectAnswers;
  }

  const gradedCompleted = correctAnswers + incorrectAnswers;
  const progressPercent =
    totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0;
  const accuracyPercent =
    gradedCompleted > 0 ? Math.round((correctAnswers / gradedCompleted) * 100) : 0;

  return {
    totalQuestions,
    completedQuestions,
    correctAnswers,
    incorrectAnswers,
    progressPercent,
    accuracyPercent,
    totalSessions: state.sessionHistory.length,
  };
}

export function getSessionKey(subjectId: string, mode: 'practice' | 'exam'): string {
  return `${subjectId}:${mode}`;
}
