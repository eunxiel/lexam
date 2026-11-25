import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Clock,
  History,
  Layers,
  Play,
  Plus,
  Target,
  Trash2,
} from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { getSessionKey } from '../../services/questionRepository';
import type { ActiveSession, PracticeMode, SessionResult } from '../../types/exam';
import { formatDuration, formatReadableDuration, formatShortDate } from '../../utils/formatters';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ConfirmModal } from '../ui/ConfirmModal';
import { EmptyState } from '../ui/EmptyState';
import { ProgressBar } from '../ui/ProgressBar';
import { MetricCard } from './MetricCard';
import { SubjectCard } from './SubjectCard';

interface DashboardViewProps {
  onStartMode: (subjectId: string, mode: PracticeMode) => void;
  onRestartSubjectFresh: (subjectId: string) => void;
  onResumeSession: (session: ActiveSession) => void;
  onReviewResult: (result: SessionResult) => void;
  onOpenSettings: (focusSubjectId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onStartMode,
  onRestartSubjectFresh,
  onResumeSession,
  onReviewResult,
  onOpenSettings,
}) => {
  const {
    state,
    overallStats,
    getSubjectById,
    getSubjectStats,
    getActiveSession,
    getMostRecentActiveSession,
    discardActiveSession,
    renameSubject,
  } = useAppState();

  const [restartSubjectId, setRestartSubjectId] = useState<string | null>(null);
  const restartSubject = restartSubjectId ? getSubjectById(restartSubjectId) : undefined;

  const recentActiveSession = getMostRecentActiveSession();
  const activeSubject = recentActiveSession
    ? getSubjectById(recentActiveSession.subjectId)
    : undefined;

  const greeting = state.preferences.studentName.trim()
    ? `Welcome back, ${state.preferences.studentName.trim()}`
    : 'Exam Practice Overview';

  const recentSessions = state.sessionHistory.slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            {greeting}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track your progress across university subjects and practice in guided or timed exam mode.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => onOpenSettings()}>
            <Plus className="h-3.5 w-3.5" />
            Manage Subjects &amp; Import
          </Button>
        </div>
      </section>

      {/* Quick Continue Banner */}
      {recentActiveSession && activeSubject && (
        <Card
          padding="md"
          className="border-indigo-200/80 bg-indigo-50/40 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3.5">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Play className="h-4 w-4 fill-current" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">
                  Continue {activeSubject.name}
                </span>
                <Badge tone="info">
                  {recentActiveSession.mode === 'practice' ? 'Practice Mode' : 'Exam Mode'}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-slate-600 tabular-nums">
                Question {recentActiveSession.currentIndex + 1} of{' '}
                {recentActiveSession.questionIds.length} &middot;{' '}
                {Object.keys(recentActiveSession.answers).length} answered &middot;{' '}
                {formatDuration(recentActiveSession.elapsedSeconds)} elapsed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                discardActiveSession(
                  getSessionKey(recentActiveSession.subjectId, recentActiveSession.mode)
                )
              }
              title="Discard paused session"
            >
              <Trash2 className="h-3.5 w-3.5 text-slate-400" />
              Discard
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onResumeSession(recentActiveSession)}
            >
              Continue Session
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* Overall Metrics */}
      <section aria-label="Overall learning statistics" className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Overall Progress"
            value={`${overallStats.progressPercent}%`}
            sublabel={`${overallStats.completedQuestions} of ${overallStats.totalQuestions} questions`}
            icon={<Layers className="h-4 w-4" />}
            accent="indigo"
          />
          <MetricCard
            label="Questions Completed"
            value={overallStats.completedQuestions}
            sublabel={`Across ${state.subjects.length} subject${state.subjects.length === 1 ? '' : 's'}`}
            icon={<BookOpenCheck className="h-4 w-4" />}
          />
          <MetricCard
            label="Correct Answers"
            value={overallStats.correctAnswers}
            sublabel={
              overallStats.incorrectAnswers > 0
                ? `${overallStats.incorrectAnswers} incorrect so far`
                : 'Verified answers recorded'
            }
            icon={<CheckCircle2 className="h-4 w-4" />}
            accent="emerald"
          />
          <MetricCard
            label="Overall Accuracy"
            value={
              overallStats.completedQuestions > 0 ? `${overallStats.accuracyPercent}%` : '—'
            }
            sublabel={
              overallStats.totalSessions > 0
                ? `${overallStats.totalSessions} completed session${overallStats.totalSessions === 1 ? '' : 's'}`
                : 'Complete questions to track'
            }
            icon={<Target className="h-4 w-4" />}
          />
        </div>

        <Card padding="sm" className="px-5 py-3.5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-medium text-slate-600">
              Combined Exam Readiness Progress
            </span>
            <span className="font-semibold text-slate-900 tabular-nums">
              {overallStats.completedQuestions} / {overallStats.totalQuestions} completed ({overallStats.progressPercent}%)
            </span>
          </div>
          <ProgressBar
            value={overallStats.progressPercent}
            tone={overallStats.progressPercent === 100 ? 'emerald' : 'indigo'}
            size="md"
          />
        </Card>
      </section>

      {/* Subjects Grid */}
      <section aria-label="Subjects" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Your Subjects</h2>
            <p className="text-xs text-slate-500">
              Click the pencil icon on any card to rename a subject, or start a Practice or Exam session.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400 tabular-nums">
            {state.subjects.length} active
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {state.subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              stats={getSubjectStats(subject.id)}
              activePracticeSession={getActiveSession(subject.id, 'practice')}
              activeExamSession={getActiveSession(subject.id, 'exam')}
              onStartMode={onStartMode}
              onRestartSubject={(id) => setRestartSubjectId(id)}
              onRenameSubject={(id, newName) => renameSubject(id, { name: newName })}
              onGoToImport={(id) => onOpenSettings(id)}
            />
          ))}
        </div>
      </section>

      {/* Recent Practice Sessions */}
      <section aria-label="Recent practice sessions" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Recent Sessions</h2>
            <p className="text-xs text-slate-500">
              Review your latest completed practice and exam attempts.
            </p>
          </div>
          {state.sessionHistory.length > 0 && (
            <span className="text-xs font-medium text-slate-400 tabular-nums">
              Showing {recentSessions.length} of {state.sessionHistory.length}
            </span>
          )}
        </div>

        {recentSessions.length === 0 ? (
          <EmptyState
            icon={<History className="h-5 w-5" />}
            title="No completed sessions yet"
            description="Start a Practice or Exam session in any subject above. Your completed attempts and detailed answer reviews will appear here."
          />
        ) : (
          <Card padding="none" className="overflow-hidden">
            <div className="divide-y divide-slate-100">
              {recentSessions.map((session) => {
                const gradable = session.totalQuestions - session.unverifiedCount;
                return (
                  <div
                    key={session.id}
                    className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">
                          {session.subjectName}
                        </span>
                        <Badge tone={session.mode === 'exam' ? 'info' : 'neutral'}>
                          {session.mode === 'exam' ? 'Exam' : 'Practice'}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          {formatShortDate(session.completedAt)}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 tabular-nums">
                        <span>
                          Score:{' '}
                          <strong className="font-medium text-slate-700">
                            {session.correctCount}/{gradable}
                          </strong>
                        </span>
                        <span>
                          Accuracy:{' '}
                          <strong className="font-medium text-slate-700">
                            {session.accuracyPercent}%
                          </strong>
                        </span>
                        {session.unansweredCount > 0 && (
                          <span>{session.unansweredCount} unanswered</span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {formatReadableDuration(session.durationSeconds)}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onReviewResult(session)}
                      className="self-start sm:self-center shrink-0"
                    >
                      Review Answers
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </section>

      <ConfirmModal
        open={Boolean(restartSubject)}
        title={`Mulai ulang ${restartSubject?.name ?? ''} dengan urutan acak?`}
        description="Semua jawaban yang sudah dijawab dan sesi yang sedang berjalan untuk mata kuliah ini akan dihapus, urutan soal akan diacak kembali, lalu latihan dimulai dari soal nomor 1."
        confirmLabel="Ya, Hapus & Mulai Ulang"
        cancelLabel="Batal"
        confirmVariant="danger"
        onCancel={() => setRestartSubjectId(null)}
        onConfirm={() => {
          if (restartSubjectId) {
            onRestartSubjectFresh(restartSubjectId);
          }
          setRestartSubjectId(null);
        }}
      />
    </div>
  );
};
