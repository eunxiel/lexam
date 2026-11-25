import React, { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { DashboardView } from './components/dashboard/DashboardView';
import { QuestionBankView } from './components/bank/QuestionBankView';
import { QuizView } from './components/quiz/QuizView';
import { ResultsView } from './components/results/ResultsView';
import { SettingsView } from './components/settings/SettingsView';
import { AppStateProvider, useAppState } from './context/AppStateContext';
import { getSessionKey } from './services/questionRepository';
import type { ActiveSession, AppView, PracticeMode, SessionResult } from './types/exam';

const AppContent: React.FC = () => {
  const { isHydrating, startSession } = useAppState();
  const [view, setView] = useState<AppView>('dashboard');
  const [activeSessionKey, setActiveSessionKey] = useState<string | null>(null);
  const [activeResult, setActiveResult] = useState<SessionResult | null>(null);
  const [settingsImportSubjectId, setSettingsImportSubjectId] = useState<string | undefined>(
    undefined
  );

  const handleStartMode = (
    subjectId: string,
    mode: PracticeMode,
    options?: { startQuestionId?: string; forceFresh?: boolean }
  ) => {
    const session = startSession(subjectId, mode, options);
    if (!session) return;
    setActiveSessionKey(getSessionKey(subjectId, mode));
    setView('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResumeSession = (session: ActiveSession) => {
    setActiveSessionKey(getSessionKey(session.subjectId, session.mode));
    setView('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompleteSession = (result: SessionResult) => {
    setActiveResult(result);
    setActiveSessionKey(null);
    setView('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReviewResult = (result: SessionResult) => {
    setActiveResult(result);
    setView('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSettings = (focusSubjectId?: string) => {
    setSettingsImportSubjectId(focusSubjectId);
    setView('settings');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (nextView: AppView) => {
    setView(nextView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isHydrating) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] px-6 py-10">
        <div className="mx-auto max-w-6xl space-y-6 animate-pulse">
          <div className="h-10 w-56 rounded-lg bg-slate-200/80" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-28 rounded-xl bg-white border border-slate-200/80" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[1, 2].map((n) => (
              <div key={n} className="h-56 rounded-xl bg-white border border-slate-200/80" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Quiz interface uses its own dedicated distraction-free shell
  if (view === 'quiz' && activeSessionKey) {
    return (
      <QuizView
        sessionKey={activeSessionKey}
        onExitToDashboard={() => handleNavigate('dashboard')}
        onCompleteSession={handleCompleteSession}
      />
    );
  }

  return (
    <AppShell
      currentView={view}
      onNavigate={handleNavigate}
      onResumeSession={handleResumeSession}
    >
      {view === 'dashboard' && (
        <DashboardView
          onStartMode={(subjectId, mode) => handleStartMode(subjectId, mode)}
          onResumeSession={handleResumeSession}
          onReviewResult={handleReviewResult}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {view === 'bank' && (
        <QuestionBankView
          onPracticeQuestion={(subjectId, questionId) =>
            handleStartMode(subjectId, 'practice', { startQuestionId: questionId })
          }
        />
      )}

      {view === 'results' && activeResult && (
        <ResultsView
          result={activeResult}
          onRetry={(subjectId, mode) =>
            handleStartMode(subjectId, mode, { forceFresh: true })
          }
          onBackToDashboard={() => handleNavigate('dashboard')}
        />
      )}

      {view === 'settings' && (
        <SettingsView initialImportSubjectId={settingsImportSubjectId} />
      )}
    </AppShell>
  );
};

export const App: React.FC = () => {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
};

export default App;
