import { DEFAULT_SUBJECTS } from '../data/subjects';
import type { PersistedAppState, UserPreferences } from '../types/exam';

const STORAGE_KEY = 'lexam_exam_platform_state_v1';
const LEGACY_STORAGE_KEY = 'prepdesk_exam_platform_state_v1';

export const DEFAULT_PREFERENCES: UserPreferences = {
  studentName: '',
  defaultMode: 'practice',
  showTimer: true,
  confirmBeforeExamSubmit: true,
  enableKeyboardShortcuts: true,
};

export function createInitialState(): PersistedAppState {
  return {
    version: 1,
    subjects: DEFAULT_SUBJECTS.map((subject) => ({ ...subject })),
    customQuestions: {},
    hidePlaceholdersBySubject: {},
    questionProgress: {},
    activeSessions: {},
    sessionHistory: [],
    preferences: { ...DEFAULT_PREFERENCES },
  };
}

/**
 * Storage abstraction backed by LocalStorage.
 * Designed as a clean boundary so a backend API client can replace it
 * without modifying UI components.
 */
export const storageService = {
  loadState(): PersistedAppState {
    const fallback = createInitialState();
    try {
      const raw =
        window.localStorage.getItem(STORAGE_KEY) ??
        window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!raw) return fallback;

      const parsed = JSON.parse(raw) as Partial<PersistedAppState>;
      if (!parsed || typeof parsed !== 'object') return fallback;

      // Upgrade untouched placeholder subject metadata automatically to real imported subjects
      const loadedSubjects =
        Array.isArray(parsed.subjects) && parsed.subjects.length > 0
          ? parsed.subjects.map((subject) => {
              const defaultMatch = DEFAULT_SUBJECTS.find((d) => d.id === subject.id);
              if (
                defaultMatch &&
                (subject.name === 'Subject 01' || subject.name === 'Subject 02')
              ) {
                return { ...defaultMatch };
              }
              return subject;
            })
          : fallback.subjects;

      // Drop stale active sessions that only referenced old placeholder question IDs
      const cleanedActiveSessions: PersistedAppState['activeSessions'] = {};
      if (parsed.activeSessions && typeof parsed.activeSessions === 'object') {
        for (const [key, session] of Object.entries(parsed.activeSessions)) {
          const hasOnlyPlaceholders =
            Array.isArray(session.questionIds) &&
            session.questionIds.length > 0 &&
            session.questionIds.every((id) => id.includes('-placeholder-'));
          if (!hasOnlyPlaceholders) {
            cleanedActiveSessions[key] = session;
          }
        }
      }

      return {
        version: 1,
        subjects: loadedSubjects,
        customQuestions:
          parsed.customQuestions && typeof parsed.customQuestions === 'object'
            ? parsed.customQuestions
            : {},
        hidePlaceholdersBySubject:
          parsed.hidePlaceholdersBySubject && typeof parsed.hidePlaceholdersBySubject === 'object'
            ? parsed.hidePlaceholdersBySubject
            : {},
        questionProgress:
          parsed.questionProgress && typeof parsed.questionProgress === 'object'
            ? parsed.questionProgress
            : {},
        activeSessions: cleanedActiveSessions,
        sessionHistory: Array.isArray(parsed.sessionHistory) ? parsed.sessionHistory : [],
        preferences: {
          ...DEFAULT_PREFERENCES,
          ...(parsed.preferences ?? {}),
        },
      };
    } catch {
      return fallback;
    }
  },

  saveState(state: PersistedAppState): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota or private-browsing storage errors gracefully
    }
  },

  clearState(): void {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors gracefully
    }
  },
};
