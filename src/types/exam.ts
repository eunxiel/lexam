export type OptionKey = 'A' | 'B' | 'C' | 'D';

export const OPTION_KEYS: readonly OptionKey[] = ['A', 'B', 'C', 'D'] as const;

export type PracticeMode = 'practice' | 'exam';

export type AppView = 'dashboard' | 'quiz' | 'results' | 'bank' | 'settings';

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  createdAt: string;
}

export interface QuestionOptions {
  A: string;
  B: string;
  C: string;
  D: string;
}

export interface QuestionSource {
  fileName?: string;
  page?: number;
  originalNumber?: string | number;
}

export interface QuestionTable {
  headers: string[];
  rows: string[][];
}

export interface Question {
  id: string;
  subjectId: string;
  text: string;
  codeBlock?: string;
  table?: QuestionTable;
  imageUrl?: string;
  imageAlt?: string;
  options: QuestionOptions;
  optionImages?: Partial<Record<OptionKey, string>>;
  /**
   * Exact answer key from the source PDF.
   * Must remain `null` (never guessed) if missing or ambiguous in the PDF,
   * paired with `needsVerification: true`.
   */
  correctAnswer: OptionKey | null;
  explanation?: string;
  source?: QuestionSource;
  needsVerification?: boolean;
  verificationNote?: string;
  isPlaceholder?: boolean;
}

export interface QuestionProgress {
  questionId: string;
  subjectId: string;
  selectedAnswer: OptionKey;
  /** `null` when the question's answer key is pending manual verification. */
  isCorrect: boolean | null;
  attempts: number;
  lastAttemptedAt: string;
  lastMode: PracticeMode;
}

export interface ActiveSession {
  id: string;
  subjectId: string;
  mode: PracticeMode;
  questionIds: string[];
  currentIndex: number;
  answers: Record<string, OptionKey>;
  flaggedIds: string[];
  startedAt: string;
  elapsedSeconds: number;
  lastUpdatedAt: string;
}

export interface SessionAnswerSnapshot {
  questionId: string;
  selectedAnswer: OptionKey | null;
  correctAnswer: OptionKey | null;
  isCorrect: boolean | null;
}

export interface SessionResult {
  id: string;
  subjectId: string;
  subjectName: string;
  mode: PracticeMode;
  completedAt: string;
  durationSeconds: number;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  unverifiedCount: number;
  accuracyPercent: number;
  answers: SessionAnswerSnapshot[];
}

export interface UserPreferences {
  studentName: string;
  defaultMode: PracticeMode;
  showTimer: boolean;
  confirmBeforeExamSubmit: boolean;
  enableKeyboardShortcuts: boolean;
}

export interface PersistedAppState {
  version: 1;
  subjects: Subject[];
  customQuestions: Record<string, Question[]>;
  hidePlaceholdersBySubject: Record<string, boolean>;
  questionProgress: Record<string, QuestionProgress>;
  activeSessions: Record<string, ActiveSession>;
  sessionHistory: SessionResult[];
  preferences: UserPreferences;
}

export interface SubjectStats {
  subjectId: string;
  totalQuestions: number;
  completedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unverifiedQuestions: number;
  placeholderCount: number;
  progressPercent: number;
  accuracyPercent: number;
}

export interface OverallStats {
  totalQuestions: number;
  completedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  progressPercent: number;
  accuracyPercent: number;
  totalSessions: number;
}
