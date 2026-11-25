import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  computeOverallStats,
  computeSubjectStats,
  getAllQuestions,
  getQuestionsBySubject,
  getSessionKey,
} from '../services/questionRepository';
import { createInitialState, storageService } from '../services/storageService';
import type {
  ActiveSession,
  OptionKey,
  OverallStats,
  PersistedAppState,
  PracticeMode,
  Question,
  SessionAnswerSnapshot,
  SessionResult,
  Subject,
  SubjectStats,
  UserPreferences,
} from '../types/exam';
import { slugifySubjectId } from '../utils/formatters';

interface StartSessionOptions {
  startQuestionId?: string;
  forceFresh?: boolean;
}

interface AppStateContextValue {
  state: PersistedAppState;
  isHydrating: boolean;
  overallStats: OverallStats;
  getSubjectById: (subjectId: string) => Subject | undefined;
  getQuestionsForSubject: (subjectId: string) => Question[];
  getQuestionById: (questionId: string) => Question | undefined;
  getAllLoadedQuestions: () => Question[];
  getSubjectStats: (subjectId: string) => SubjectStats;
  getActiveSession: (subjectId: string, mode: PracticeMode) => ActiveSession | undefined;
  getActiveSessionByKey: (sessionKey: string) => ActiveSession | undefined;
  getMostRecentActiveSession: () => ActiveSession | undefined;
  startSession: (
    subjectId: string,
    mode: PracticeMode,
    options?: StartSessionOptions
  ) => ActiveSession | null;
  selectAnswer: (sessionKey: string, questionId: string, answer: OptionKey) => void;
  toggleFlagQuestion: (sessionKey: string, questionId: string) => void;
  setSessionQuestionIndex: (sessionKey: string, index: number) => void;
  updateSessionElapsed: (sessionKey: string, elapsedSeconds: number) => void;
  finishSession: (sessionKey: string, elapsedSecondsOverride?: number) => SessionResult | null;
  restartSession: (
    sessionKey: string,
    options?: { clearSubjectProgress?: boolean }
  ) => void;
  discardActiveSession: (sessionKey: string) => void;
  renameSubject: (
    subjectId: string,
    updates: { name: string; code?: string; description?: string }
  ) => void;
  addSubject: (input: { name: string; code: string; description: string }) => Subject;
  deleteSubject: (subjectId: string) => void;
  importQuestionsForSubject: (
    subjectId: string,
    questions: Question[],
    options: { replaceExistingCustom?: boolean; hidePlaceholders?: boolean }
  ) => void;
  clearCustomQuestionsForSubject: (subjectId: string) => void;
  updatePreferences: (partial: Partial<UserPreferences>) => void;
  resetSubjectProgress: (subjectId: string) => void;
  resetAllProgress: () => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PersistedAppState>(() => storageService.loadState());
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    // Allow initial frame to mount cleanly before revealing content
    const timer = window.setTimeout(() => setIsHydrating(false), 120);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    storageService.saveState(state);
  }, [state]);

  const overallStats = useMemo(() => computeOverallStats(state), [state]);

  const allQuestionsMap = useMemo(() => {
    const map = new Map<string, Question>();
    for (const q of getAllQuestions(state)) {
      map.set(q.id, q);
    }
    return map;
  }, [state]);

  const getSubjectById = useCallback(
    (subjectId: string) => state.subjects.find((s) => s.id === subjectId),
    [state.subjects]
  );

  const getQuestionsForSubject = useCallback(
    (subjectId: string) => getQuestionsBySubject(state, subjectId),
    [state]
  );

  const getQuestionById = useCallback(
    (questionId: string) => allQuestionsMap.get(questionId),
    [allQuestionsMap]
  );

  const getAllLoadedQuestions = useCallback(() => getAllQuestions(state), [state]);

  const getSubjectStats = useCallback(
    (subjectId: string) => computeSubjectStats(state, subjectId),
    [state]
  );

  const getActiveSession = useCallback(
    (subjectId: string, mode: PracticeMode) =>
      state.activeSessions[getSessionKey(subjectId, mode)],
    [state.activeSessions]
  );

  const getActiveSessionByKey = useCallback(
    (sessionKey: string) => state.activeSessions[sessionKey],
    [state.activeSessions]
  );

  const getMostRecentActiveSession = useCallback(() => {
    const sessions = Object.values(state.activeSessions);
    if (sessions.length === 0) return undefined;
    return sessions.sort(
      (a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime()
    )[0];
  }, [state.activeSessions]);

  const startSession = useCallback(
    (
      subjectId: string,
      mode: PracticeMode,
      options?: StartSessionOptions
    ): ActiveSession | null => {
      const questions = getQuestionsBySubject(state, subjectId);
      if (questions.length === 0) return null;

      const sessionKey = getSessionKey(subjectId, mode);
      const existing = state.activeSessions[sessionKey];

      if (existing && !options?.forceFresh) {
        // Reconcile if question bank changed since session began
        const validIds = questions.map((q) => q.id);
        const startIdx = options?.startQuestionId
          ? Math.max(0, validIds.indexOf(options.startQuestionId))
          : Math.min(existing.currentIndex, validIds.length - 1);

        const resumed: ActiveSession = {
          ...existing,
          questionIds: validIds,
          currentIndex: startIdx,
          lastUpdatedAt: new Date().toISOString(),
        };

        setState((prev) => ({
          ...prev,
          activeSessions: {
            ...prev.activeSessions,
            [sessionKey]: resumed,
          },
        }));
        return resumed;
      }

      const questionIds = questions.map((q) => q.id);
      const startIndex = options?.startQuestionId
        ? Math.max(0, questionIds.indexOf(options.startQuestionId))
        : 0;
      const now = new Date().toISOString();

      const newSession: ActiveSession = {
        id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        subjectId,
        mode,
        questionIds,
        currentIndex: startIndex,
        answers: {},
        flaggedIds: [],
        startedAt: now,
        elapsedSeconds: 0,
        lastUpdatedAt: now,
      };

      setState((prev) => ({
        ...prev,
        activeSessions: {
          ...prev.activeSessions,
          [sessionKey]: newSession,
        },
      }));

      return newSession;
    },
    [state]
  );

  const selectAnswer = useCallback(
    (sessionKey: string, questionId: string, answer: OptionKey) => {
      setState((prev) => {
        const session = prev.activeSessions[sessionKey];
        if (!session) return prev;

        // In Practice Mode, prevent changing an answer once submitted
        if (session.mode === 'practice' && session.answers[questionId]) {
          return prev;
        }

        const now = new Date().toISOString();
        const updatedSession: ActiveSession = {
          ...session,
          answers: {
            ...session.answers,
            [questionId]: answer,
          },
          lastUpdatedAt: now,
        };

        let nextQuestionProgress = prev.questionProgress;

        // In Practice Mode, evaluate and persist progress immediately
        if (session.mode === 'practice') {
          const subjectQuestions = getQuestionsBySubject(prev, session.subjectId);
          const question = subjectQuestions.find((q) => q.id === questionId);
          const isCorrect =
            question && question.correctAnswer !== null
              ? answer === question.correctAnswer
              : null;

          const prevProgress = prev.questionProgress[questionId];
          nextQuestionProgress = {
            ...prev.questionProgress,
            [questionId]: {
              questionId,
              subjectId: session.subjectId,
              selectedAnswer: answer,
              isCorrect,
              attempts: (prevProgress?.attempts ?? 0) + 1,
              lastAttemptedAt: now,
              lastMode: 'practice',
            },
          };
        }

        return {
          ...prev,
          activeSessions: {
            ...prev.activeSessions,
            [sessionKey]: updatedSession,
          },
          questionProgress: nextQuestionProgress,
        };
      });
    },
    []
  );

  const toggleFlagQuestion = useCallback((sessionKey: string, questionId: string) => {
    setState((prev) => {
      const session = prev.activeSessions[sessionKey];
      if (!session) return prev;

      const exists = session.flaggedIds.includes(questionId);
      const flaggedIds = exists
        ? session.flaggedIds.filter((id) => id !== questionId)
        : [...session.flaggedIds, questionId];

      return {
        ...prev,
        activeSessions: {
          ...prev.activeSessions,
          [sessionKey]: {
            ...session,
            flaggedIds,
            lastUpdatedAt: new Date().toISOString(),
          },
        },
      };
    });
  }, []);

  const setSessionQuestionIndex = useCallback((sessionKey: string, index: number) => {
    setState((prev) => {
      const session = prev.activeSessions[sessionKey];
      if (!session) return prev;
      const clamped = Math.max(0, Math.min(index, session.questionIds.length - 1));
      if (clamped === session.currentIndex) return prev;

      return {
        ...prev,
        activeSessions: {
          ...prev.activeSessions,
          [sessionKey]: {
            ...session,
            currentIndex: clamped,
            lastUpdatedAt: new Date().toISOString(),
          },
        },
      };
    });
  }, []);

  const updateSessionElapsed = useCallback((sessionKey: string, elapsedSeconds: number) => {
    setState((prev) => {
      const session = prev.activeSessions[sessionKey];
      if (!session) return prev;
      return {
        ...prev,
        activeSessions: {
          ...prev.activeSessions,
          [sessionKey]: {
            ...session,
            elapsedSeconds,
          },
        },
      };
    });
  }, []);

  const finishSession = useCallback(
    (sessionKey: string, elapsedSecondsOverride?: number): SessionResult | null => {
      const session = state.activeSessions[sessionKey];
      if (!session) return null;

      const subject = state.subjects.find((s) => s.id === session.subjectId);
      const subjectQuestions = getQuestionsBySubject(state, session.subjectId);
      const questionMap = new Map(subjectQuestions.map((q) => [q.id, q]));

      const now = new Date().toISOString();
      const snapshots: SessionAnswerSnapshot[] = [];
      let answeredCount = 0;
      let correctCount = 0;
      let incorrectCount = 0;
      let unverifiedCount = 0;

      const updatedProgress = { ...state.questionProgress };

      for (const questionId of session.questionIds) {
        const question = questionMap.get(questionId);
        const selectedAnswer = session.answers[questionId] ?? null;
        const correctAnswer = question?.correctAnswer ?? null;

        if (correctAnswer === null) {
          unverifiedCount += 1;
        }

        let isCorrect: boolean | null = null;
        if (selectedAnswer !== null) {
          answeredCount += 1;
          if (correctAnswer !== null) {
            isCorrect = selectedAnswer === correctAnswer;
            if (isCorrect) {
              correctCount += 1;
            } else {
              incorrectCount += 1;
            }
          }

          // Persist answer to cumulative progress for Exam Mode (Practice already saved immediately)
          if (session.mode === 'exam') {
            const prevProgress = updatedProgress[questionId];
            updatedProgress[questionId] = {
              questionId,
              subjectId: session.subjectId,
              selectedAnswer,
              isCorrect,
              attempts: (prevProgress?.attempts ?? 0) + 1,
              lastAttemptedAt: now,
              lastMode: 'exam',
            };
          }
        }

        snapshots.push({
          questionId,
          selectedAnswer,
          correctAnswer,
          isCorrect,
        });
      }

      const totalQuestions = session.questionIds.length;
      const unansweredCount = totalQuestions - answeredCount;
      const gradableTotal = totalQuestions - unverifiedCount;
      const gradedAnswered = correctCount + incorrectCount;

      const accuracyPercent =
        session.mode === 'exam'
          ? gradableTotal > 0
            ? Math.round((correctCount / gradableTotal) * 100)
            : 0
          : gradedAnswered > 0
            ? Math.round((correctCount / gradedAnswered) * 100)
            : 0;

      const result: SessionResult = {
        id: session.id,
        subjectId: session.subjectId,
        subjectName: subject?.name ?? session.subjectId,
        mode: session.mode,
        completedAt: now,
        durationSeconds: elapsedSecondsOverride ?? session.elapsedSeconds,
        totalQuestions,
        answeredCount,
        correctCount,
        incorrectCount,
        unansweredCount,
        unverifiedCount,
        accuracyPercent,
        answers: snapshots,
      };

      setState((prev) => {
        const nextSessions = { ...prev.activeSessions };
        delete nextSessions[sessionKey];

        return {
          ...prev,
          questionProgress: updatedProgress,
          activeSessions: nextSessions,
          sessionHistory: [result, ...prev.sessionHistory].slice(0, 50),
        };
      });

      return result;
    },
    [state]
  );

  const restartSession = useCallback(
    (sessionKey: string, options?: { clearSubjectProgress?: boolean }) => {
      setState((prev) => {
        const session = prev.activeSessions[sessionKey];
        if (!session) return prev;

        const subjectQuestions = getQuestionsBySubject(prev, session.subjectId);
        const questionIds =
          subjectQuestions.length > 0
            ? subjectQuestions.map((q) => q.id)
            : session.questionIds;
        const now = new Date().toISOString();

        const freshSession: ActiveSession = {
          id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          subjectId: session.subjectId,
          mode: session.mode,
          questionIds,
          currentIndex: 0,
          answers: {},
          flaggedIds: [],
          startedAt: now,
          elapsedSeconds: 0,
          lastUpdatedAt: now,
        };

        let nextQuestionProgress = prev.questionProgress;
        if (options?.clearSubjectProgress) {
          nextQuestionProgress = {};
          for (const [qId, entry] of Object.entries(prev.questionProgress)) {
            if (entry.subjectId !== session.subjectId) {
              nextQuestionProgress[qId] = entry;
            }
          }
        }

        return {
          ...prev,
          questionProgress: nextQuestionProgress,
          activeSessions: {
            ...prev.activeSessions,
            [sessionKey]: freshSession,
          },
        };
      });
    },
    []
  );

  const discardActiveSession = useCallback((sessionKey: string) => {
    setState((prev) => {
      const nextSessions = { ...prev.activeSessions };
      delete nextSessions[sessionKey];
      return {
        ...prev,
        activeSessions: nextSessions,
      };
    });
  }, []);

  const renameSubject = useCallback(
    (subjectId: string, updates: { name: string; code?: string; description?: string }) => {
      const trimmedName = updates.name.trim();
      if (!trimmedName) return;

      setState((prev) => ({
        ...prev,
        subjects: prev.subjects.map((subject) =>
          subject.id === subjectId
            ? {
                ...subject,
                name: trimmedName,
                code: updates.code !== undefined ? updates.code.trim() || subject.code : subject.code,
                description:
                  updates.description !== undefined
                    ? updates.description.trim()
                    : subject.description,
              }
            : subject
        ),
        sessionHistory: prev.sessionHistory.map((item) =>
          item.subjectId === subjectId ? { ...item, subjectName: trimmedName } : item
        ),
      }));
    },
    []
  );

  const addSubject = useCallback(
    (input: { name: string; code: string; description: string }): Subject => {
      const baseId = slugifySubjectId(input.name);
      let uniqueId = baseId;
      let counter = 2;
      while (state.subjects.some((s) => s.id === uniqueId)) {
        uniqueId = `${baseId}-${counter}`;
        counter += 1;
      }

      const newSubject: Subject = {
        id: uniqueId,
        name: input.name.trim(),
        code: input.code.trim() || uniqueId.toUpperCase(),
        description: input.description.trim() || 'Ready for exam question import.',
        createdAt: new Date().toISOString(),
      };

      setState((prev) => ({
        ...prev,
        subjects: [...prev.subjects, newSubject],
      }));

      return newSubject;
    },
    [state.subjects]
  );

  const deleteSubject = useCallback((subjectId: string) => {
    setState((prev) => {
      if (prev.subjects.length <= 1) return prev;

      const nextSubjects = prev.subjects.filter((s) => s.id !== subjectId);
      const nextCustom = { ...prev.customQuestions };
      delete nextCustom[subjectId];

      const nextHide = { ...prev.hidePlaceholdersBySubject };
      delete nextHide[subjectId];

      const nextProgress: typeof prev.questionProgress = {};
      for (const [qId, entry] of Object.entries(prev.questionProgress)) {
        if (entry.subjectId !== subjectId) {
          nextProgress[qId] = entry;
        }
      }

      const nextSessions: typeof prev.activeSessions = {};
      for (const [key, sess] of Object.entries(prev.activeSessions)) {
        if (sess.subjectId !== subjectId) {
          nextSessions[key] = sess;
        }
      }

      return {
        ...prev,
        subjects: nextSubjects,
        customQuestions: nextCustom,
        hidePlaceholdersBySubject: nextHide,
        questionProgress: nextProgress,
        activeSessions: nextSessions,
        sessionHistory: prev.sessionHistory.filter((item) => item.subjectId !== subjectId),
      };
    });
  }, []);

  const importQuestionsForSubject = useCallback(
    (
      subjectId: string,
      questions: Question[],
      options: { replaceExistingCustom?: boolean; hidePlaceholders?: boolean }
    ) => {
      setState((prev) => {
        const existing = options.replaceExistingCustom ? [] : (prev.customQuestions[subjectId] ?? []);
        const map = new Map<string, Question>();
        for (const q of existing) map.set(q.id, q);
        for (const q of questions) map.set(q.id, { ...q, subjectId });

        return {
          ...prev,
          customQuestions: {
            ...prev.customQuestions,
            [subjectId]: Array.from(map.values()),
          },
          hidePlaceholdersBySubject: {
            ...prev.hidePlaceholdersBySubject,
            [subjectId]: options.hidePlaceholders ?? true,
          },
        };
      });
    },
    []
  );

  const clearCustomQuestionsForSubject = useCallback((subjectId: string) => {
    setState((prev) => {
      const nextCustom = { ...prev.customQuestions };
      delete nextCustom[subjectId];

      const nextHide = { ...prev.hidePlaceholdersBySubject };
      delete nextHide[subjectId];

      return {
        ...prev,
        customQuestions: nextCustom,
        hidePlaceholdersBySubject: nextHide,
      };
    });
  }, []);

  const updatePreferences = useCallback((partial: Partial<UserPreferences>) => {
    setState((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        ...partial,
      },
    }));
  }, []);

  const resetSubjectProgress = useCallback((subjectId: string) => {
    setState((prev) => {
      const nextProgress: typeof prev.questionProgress = {};
      for (const [qId, entry] of Object.entries(prev.questionProgress)) {
        if (entry.subjectId !== subjectId) {
          nextProgress[qId] = entry;
        }
      }

      const nextSessions: typeof prev.activeSessions = {};
      for (const [key, sess] of Object.entries(prev.activeSessions)) {
        if (sess.subjectId !== subjectId) {
          nextSessions[key] = sess;
        }
      }

      return {
        ...prev,
        questionProgress: nextProgress,
        activeSessions: nextSessions,
        sessionHistory: prev.sessionHistory.filter((item) => item.subjectId !== subjectId),
      };
    });
  }, []);

  const resetAllProgress = useCallback(() => {
    setState((prev) => ({
      ...prev,
      questionProgress: {},
      activeSessions: {},
      sessionHistory: [],
    }));
  }, []);

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      isHydrating,
      overallStats,
      getSubjectById,
      getQuestionsForSubject,
      getQuestionById,
      getAllLoadedQuestions,
      getSubjectStats,
      getActiveSession,
      getActiveSessionByKey,
      getMostRecentActiveSession,
      startSession,
      selectAnswer,
      toggleFlagQuestion,
      setSessionQuestionIndex,
      updateSessionElapsed,
      finishSession,
      restartSession,
      discardActiveSession,
      renameSubject,
      addSubject,
      deleteSubject,
      importQuestionsForSubject,
      clearCustomQuestionsForSubject,
      updatePreferences,
      resetSubjectProgress,
      resetAllProgress,
    }),
    [
      state,
      isHydrating,
      overallStats,
      getSubjectById,
      getQuestionsForSubject,
      getQuestionById,
      getAllLoadedQuestions,
      getSubjectStats,
      getActiveSession,
      getActiveSessionByKey,
      getMostRecentActiveSession,
      startSession,
      selectAnswer,
      toggleFlagQuestion,
      setSessionQuestionIndex,
      updateSessionElapsed,
      finishSession,
      restartSession,
      discardActiveSession,
      renameSubject,
      addSubject,
      deleteSubject,
      importQuestionsForSubject,
      clearCustomQuestionsForSubject,
      updatePreferences,
      resetSubjectProgress,
      resetAllProgress,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return ctx;
}

export { createInitialState };
