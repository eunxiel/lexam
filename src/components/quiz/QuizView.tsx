import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Flag,
  Grid2x2,
  Info,
  RotateCcw,
  X,
  XCircle,
} from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { OPTION_KEYS, type OptionKey, type SessionResult } from '../../types/exam';
import { cn, formatDuration, resolveAssetUrl } from '../../utils/formatters';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ConfirmModal } from '../ui/ConfirmModal';
import { EmptyState } from '../ui/EmptyState';
import { ProgressBar } from '../ui/ProgressBar';
import { OptionCard } from './OptionCard';
import { QuestionNavigator } from './QuestionNavigator';

interface QuizViewProps {
  sessionKey: string;
  onExitToDashboard: () => void;
  onCompleteSession: (result: SessionResult) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  sessionKey,
  onExitToDashboard,
  onCompleteSession,
}) => {
  const {
    state,
    getActiveSessionByKey,
    getSubjectById,
    getQuestionsForSubject,
    selectAnswer,
    toggleFlagQuestion,
    setSessionQuestionIndex,
    updateSessionElapsed,
    finishSession,
    restartSession,
  } = useAppState();

  const session = getActiveSessionByKey(sessionKey);
  const subject = session ? getSubjectById(session.subjectId) : undefined;
  const [elapsedSeconds, setElapsedSeconds] = useState(session?.elapsedSeconds ?? 0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [alsoClearSubjectProgress, setAlsoClearSubjectProgress] = useState(true);
  const [showMobileNavigator, setShowMobileNavigator] = useState(false);
  const [imageError, setImageError] = useState(false);

  const elapsedRef = useRef(elapsedSeconds);
  elapsedRef.current = elapsedSeconds;

  const questions = useMemo(() => {
    if (!session) return [];
    const allSubjectQuestions = getQuestionsForSubject(session.subjectId);
    const byId = new Map(allSubjectQuestions.map((q) => [q.id, q]));
    return session.questionIds
      .map((id) => byId.get(id))
      .filter((q): q is NonNullable<typeof q> => Boolean(q));
  }, [session, getQuestionsForSubject]);

  const currentIndex = session ? Math.min(session.currentIndex, Math.max(0, questions.length - 1)) : 0;
  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    setImageError(false);
  }, [currentQuestion?.id]);

  // Sync timer smoothly and persist every 5 seconds & on unmount
  useEffect(() => {
    if (!session) return;
    setElapsedSeconds(session.elapsedSeconds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  useEffect(() => {
    if (!session) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next % 5 === 0) {
          updateSessionElapsed(sessionKey, next);
        }
        return next;
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
      updateSessionElapsed(sessionKey, elapsedRef.current);
    };
  }, [session?.id, sessionKey, updateSessionElapsed]);

  const selectedAnswer =
    session && currentQuestion ? session.answers[currentQuestion.id] : undefined;
  const isFlagged =
    session && currentQuestion ? session.flaggedIds.includes(currentQuestion.id) : false;
  const isPractice = session?.mode === 'practice';
  const isRevealed = Boolean(isPractice && selectedAnswer);
  const isUnverified = Boolean(
    currentQuestion &&
      (currentQuestion.needsVerification || currentQuestion.correctAnswer === null)
  );
  const isCorrectSelection = Boolean(
    currentQuestion &&
      selectedAnswer &&
      currentQuestion.correctAnswer !== null &&
      selectedAnswer === currentQuestion.correctAnswer
  );

  const answeredCount = session ? Object.keys(session.answers).length : 0;
  const unansweredCount = Math.max(0, questions.length - answeredCount);
  const progressPercent =
    questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  const handleSelectOption = useCallback(
    (option: OptionKey) => {
      if (!session || !currentQuestion) return;
      if (session.mode === 'practice' && session.answers[currentQuestion.id]) {
        return;
      }
      selectAnswer(sessionKey, currentQuestion.id, option);
    },
    [session, currentQuestion, selectAnswer, sessionKey]
  );

  const handlePrev = useCallback(() => {
    if (!session || currentIndex <= 0) return;
    setSessionQuestionIndex(sessionKey, currentIndex - 1);
  }, [session, currentIndex, setSessionQuestionIndex, sessionKey]);

  const handleNext = useCallback(() => {
    if (!session || currentIndex >= questions.length - 1) return;
    setSessionQuestionIndex(sessionKey, currentIndex + 1);
  }, [session, currentIndex, questions.length, setSessionQuestionIndex, sessionKey]);

  const handleConfirmFinish = useCallback(() => {
    const result = finishSession(sessionKey, elapsedRef.current);
    setShowSubmitModal(false);
    if (result) {
      onCompleteSession(result);
    }
  }, [finishSession, onCompleteSession, sessionKey]);

  const handleFinishTrigger = useCallback(() => {
    if (!session) return;
    if (
      (session.mode === 'exam' && state.preferences.confirmBeforeExamSubmit) ||
      unansweredCount > 0
    ) {
      setShowSubmitModal(true);
    } else {
      handleConfirmFinish();
    }
  }, [
    session,
    state.preferences.confirmBeforeExamSubmit,
    unansweredCount,
    handleConfirmFinish,
  ]);

  const handleConfirmRestart = useCallback(() => {
    restartSession(sessionKey, { clearSubjectProgress: alsoClearSubjectProgress });
    setElapsedSeconds(0);
    elapsedRef.current = 0;
    setShowRestartModal(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [restartSession, sessionKey, alsoClearSubjectProgress]);

  // Keyboard shortcuts (A-D / 1-4 to select, Left / Right to navigate)
  useEffect(() => {
    if (!session || !currentQuestion || !state.preferences.enableKeyboardShortcuts) return;
    if (showSubmitModal || showRestartModal || showMobileNavigator) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = event.key.toUpperCase();
      if (key === 'ARROWLEFT') {
        event.preventDefault();
        handlePrev();
      } else if (key === 'ARROWRIGHT') {
        event.preventDefault();
        handleNext();
      } else if (key === 'A' || key === '1') {
        handleSelectOption('A');
      } else if (key === 'B' || key === '2') {
        handleSelectOption('B');
      } else if (key === 'C' || key === '3') {
        handleSelectOption('C');
      } else if (key === 'D' || key === '4') {
        handleSelectOption('D');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    session,
    currentQuestion,
    state.preferences.enableKeyboardShortcuts,
    showSubmitModal,
    showRestartModal,
    showMobileNavigator,
    handlePrev,
    handleNext,
    handleSelectOption,
  ]);

  if (!session || !currentQuestion) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-6">
        <EmptyState
          icon={<BookOpen className="h-5 w-5" />}
          title="No active quiz session"
          description="This session could not be found or its subject has no questions available."
          action={
            <Button variant="primary" onClick={onExitToDashboard}>
              Return to Dashboard
            </Button>
          }
        />
      </div>
    );
  }

  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FB]">
      {/* Dedicated Distraction-Free Quiz Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/85">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                updateSessionElapsed(sessionKey, elapsedRef.current);
                onExitToDashboard();
              }}
              className="px-2 shrink-0"
              title="Save progress and return to dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-slate-900">
                  {subject?.name ?? session.subjectId}
                </span>
                <Badge tone={isPractice ? 'neutral' : 'info'} className="shrink-0">
                  {isPractice ? 'Practice' : 'Exam'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-xs font-medium text-slate-600 tabular-nums hidden sm:inline">
              Question <strong className="text-slate-900">{currentIndex + 1}</strong> of{' '}
              {questions.length}
            </span>

            {state.preferences.showTimer && (
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 tabular-nums">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                {formatDuration(elapsedSeconds)}
              </div>
            )}

            <Button
              variant="secondary"
              size="sm"
              className="lg:hidden"
              onClick={() => setShowMobileNavigator(true)}
              aria-label="Open question navigator"
            >
              <Grid2x2 className="h-3.5 w-3.5" />
              <span className="tabular-nums">
                {currentIndex + 1}/{questions.length}
              </span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRestartModal(true)}
              title="Mulai ulang dari soal nomor 1 dan hapus semua jawaban"
              className="text-slate-600 hover:text-rose-600 hover:bg-rose-50/70"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Restart</span>
            </Button>

            <Button
              variant={isPractice ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleFinishTrigger}
            >
              {isPractice ? 'Finish' : 'Submit Exam'}
            </Button>
          </div>
        </div>

        {/* Slim Progress Indicator */}
        <ProgressBar
          value={progressPercent}
          tone={isPractice ? 'emerald' : 'indigo'}
          size="sm"
          className="rounded-none h-1"
        />
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px] items-start">
          {/* Question Card Column */}
          <div className="space-y-5">
            <Card padding="lg" className="space-y-6">
              {/* Question Top Metadata */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 tabular-nums">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  {currentQuestion.source?.originalNumber !== undefined && (
                    <span className="text-xs text-slate-400">
                      &middot; Source #{currentQuestion.source.originalNumber}
                    </span>
                  )}
                  {currentQuestion.isPlaceholder && (
                    <Badge tone="neutral">Placeholder</Badge>
                  )}
                  {isUnverified && (
                    <Badge tone="warning">
                      <AlertTriangle className="h-3 w-3" />
                      Needs Verification
                    </Badge>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => toggleFlagQuestion(sessionKey, currentQuestion.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
                    isFlagged
                      ? 'border-amber-300 bg-amber-50 text-amber-800'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  )}
                >
                  <Flag className={cn('h-3.5 w-3.5', isFlagged && 'fill-current')} />
                  {isFlagged ? 'Flagged' : 'Flag'}
                </button>
              </div>

              {/* Question Stem */}
              <div className="space-y-4">
                <p className="text-[15px] sm:text-base font-medium text-slate-900 leading-relaxed whitespace-pre-line">
                  {currentQuestion.text}
                </p>

                {currentQuestion.codeBlock && (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/90 p-4">
                    <pre className="font-mono text-xs sm:text-[13px] leading-6 text-slate-800 whitespace-pre">
                      {currentQuestion.codeBlock}
                    </pre>
                  </div>
                )}

                {currentQuestion.table && (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full border-collapse text-left text-xs sm:text-sm">
                      {currentQuestion.table.headers.length > 0 && (
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50">
                            {currentQuestion.table.headers.map((header, idx) => (
                              <th
                                key={idx}
                                className="px-3.5 py-2 font-semibold text-slate-700 border-r last:border-r-0 border-slate-200"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                      )}
                      <tbody className="divide-y divide-slate-200">
                        {currentQuestion.table.rows.map((row, rowIdx) => (
                          <tr key={rowIdx} className="bg-white">
                            {row.map((cell, cellIdx) => (
                              <td
                                key={cellIdx}
                                className="px-3.5 py-2 text-slate-700 border-r last:border-r-0 border-slate-200 font-mono text-xs sm:text-[13px]"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {currentQuestion.imageUrl && !imageError && (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4">
                    <img
                      src={resolveAssetUrl(currentQuestion.imageUrl)}
                      alt={currentQuestion.imageAlt || `Figure for question ${currentIndex + 1}`}
                      onError={() => setImageError(true)}
                      className="mx-auto max-h-80 w-auto rounded-lg object-contain"
                    />
                  </div>
                )}

                {currentQuestion.imageUrl && imageError && (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500">
                    Question image could not be loaded ({currentQuestion.imageUrl}).
                  </div>
                )}
              </div>

              {/* Option Cards (A, B, C, D) */}
              <div className="space-y-3" role="group" aria-label="Answer options">
                {OPTION_KEYS.map((key) => (
                  <OptionCard
                    key={key}
                    optionKey={key}
                    text={currentQuestion.options[key]}
                    imageUrl={currentQuestion.optionImages?.[key]}
                    mode={session.mode}
                    isSelected={selectedAnswer === key}
                    isRevealed={isRevealed}
                    isCorrectOption={currentQuestion.correctAnswer === key}
                    isUnverifiedQuestion={isUnverified}
                    disabled={isPractice && Boolean(selectedAnswer)}
                    onSelect={handleSelectOption}
                  />
                ))}
              </div>

              {/* Practice Mode Immediate Feedback & Explanation */}
              {isPractice && isRevealed && (
                <div className="space-y-3 pt-2">
                  {isUnverified ? (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <div className="text-sm text-amber-950">
                        <p className="font-semibold">
                          Answer recorded — Pending manual verification
                        </p>
                        <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                          {currentQuestion.verificationNote ||
                            'No verified answer key is attached to this question yet. Please check the original PDF.'}
                        </p>
                      </div>
                    </div>
                  ) : isCorrectSelection ? (
                    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <div className="text-sm text-emerald-950">
                        <p className="font-semibold">Correct answer</p>
                        <p className="mt-0.5 text-xs text-emerald-800">
                          You selected Option {selectedAnswer}. Your progress has been saved automatically.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/70 p-4">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                      <div className="text-sm text-rose-950">
                        <p className="font-semibold">
                          Incorrect — Correct answer is Option {currentQuestion.correctAnswer}
                        </p>
                        <p className="mt-0.5 text-xs text-rose-800">
                          You selected Option {selectedAnswer}. Review the highlighted correct answer above.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Explanation Panel (or graceful fallback) */}
                  {currentQuestion.explanation ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <Info className="h-3.5 w-3.5" />
                        Explanation
                      </div>
                      <p className="mt-1.5 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-4 py-3 text-xs text-slate-500">
                      No explanation is provided for this question.
                    </div>
                  )}
                </div>
              )}

              {/* Exam Mode helper notice */}
              {!isPractice && (
                <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 border border-slate-100 px-3.5 py-2.5 text-xs text-slate-500">
                  <span>
                    Exam Mode: Answers are hidden until you submit. You can change selections freely.
                  </span>
                  {selectedAnswer && (
                    <span className="font-medium text-slate-700 shrink-0">
                      Selected: {selectedAnswer}
                    </span>
                  )}
                </div>
              )}
            </Card>

            {/* Bottom Navigation Controls */}
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={handlePrev}
                disabled={currentIndex === 0}
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>

              {state.preferences.enableKeyboardShortcuts && (
                <span className="hidden md:inline text-xs text-slate-400">
                  Keys A–D to answer &middot; &larr; &rarr; to navigate
                </span>
              )}

              {isLastQuestion ? (
                <Button variant="primary" size="md" onClick={handleFinishTrigger}>
                  {isPractice ? 'Finish Practice' : 'Submit Exam'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant={isPractice && isRevealed ? 'primary' : 'secondary'}
                  size="md"
                  onClick={handleNext}
                >
                  Next Question
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Desktop Question Navigation Panel */}
          <aside className="hidden lg:block sticky top-20">
            <Card padding="md">
              <QuestionNavigator
                questions={questions}
                currentIndex={currentIndex}
                answers={session.answers}
                flaggedIds={session.flaggedIds}
                mode={session.mode}
                onJumpTo={(idx) => setSessionQuestionIndex(sessionKey, idx)}
                onFinishClick={handleFinishTrigger}
                onRestartClick={() => setShowRestartModal(true)}
              />
            </Card>
          </aside>
        </div>
      </main>

      {/* Mobile Question Navigator Drawer */}
      {showMobileNavigator && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 lg:hidden"
          onClick={() => setShowMobileNavigator(false)}
        >
          <div
            className="h-full w-full max-w-xs bg-white p-5 shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">Questions</span>
              <button
                type="button"
                onClick={() => setShowMobileNavigator(false)}
                aria-label="Close navigator"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <QuestionNavigator
              questions={questions}
              currentIndex={currentIndex}
              answers={session.answers}
              flaggedIds={session.flaggedIds}
              mode={session.mode}
              onJumpTo={(idx) => {
                setSessionQuestionIndex(sessionKey, idx);
                setShowMobileNavigator(false);
              }}
              onFinishClick={() => {
                setShowMobileNavigator(false);
                handleFinishTrigger();
              }}
              onRestartClick={() => {
                setShowMobileNavigator(false);
                setShowRestartModal(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Restart Session Confirmation Modal */}
      <ConfirmModal
        open={showRestartModal}
        title="Mulai ulang dari soal nomor 1?"
        description="Semua jawaban yang sudah dipilih dan tanda flag pada sesi ini akan dihapus, timer direset ke 00:00, dan Anda akan memulai kembali dari soal nomor 1."
        confirmLabel="Ya, Mulai Ulang"
        cancelLabel="Batal"
        confirmVariant="danger"
        onCancel={() => setShowRestartModal(false)}
        onConfirm={handleConfirmRestart}
      >
        <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={alsoClearSubjectProgress}
            onChange={(e) => setAlsoClearSubjectProgress(e.target.checked)}
            className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
          />
          <span>
            <strong className="font-medium text-slate-900">
              Hapus juga progres tersimpan mata kuliah ini di Dashboard
            </strong>
            <span className="block text-slate-500 mt-0.5">
              Mengosongkan status jawaban benar/salah mata kuliah ini agar dihitung dari nol.
            </span>
          </span>
        </label>
      </ConfirmModal>

      {/* Submit / Finish Confirmation Modal */}
      <ConfirmModal
        open={showSubmitModal}
        title={isPractice ? 'Finish practice session?' : 'Submit exam for grading?'}
        description={
          unansweredCount > 0
            ? `You have ${unansweredCount} unanswered question${unansweredCount === 1 ? '' : 's'} remaining. ${
                isPractice
                  ? 'You can still view your results now or go back to finish them.'
                  : 'Unanswered questions will be counted as unanswered in your final exam score.'
              }`
            : `All ${questions.length} questions have been answered. Ready to view your score and question-by-question review?`
        }
        confirmLabel={isPractice ? 'Finish & View Results' : 'Submit Exam'}
        cancelLabel="Keep Working"
        confirmVariant="primary"
        onCancel={() => setShowSubmitModal(false)}
        onConfirm={handleConfirmFinish}
      >
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 border border-slate-100 p-3 text-center text-xs">
          <div>
            <span className="block text-slate-500">Answered</span>
            <span className="mt-0.5 block text-sm font-semibold text-slate-900 tabular-nums">
              {answeredCount}
            </span>
          </div>
          <div>
            <span className="block text-slate-500">Unanswered</span>
            <span
              className={cn(
                'mt-0.5 block text-sm font-semibold tabular-nums',
                unansweredCount > 0 ? 'text-amber-600' : 'text-slate-900'
              )}
            >
              {unansweredCount}
            </span>
          </div>
          <div>
            <span className="block text-slate-500">Flagged</span>
            <span className="mt-0.5 block text-sm font-semibold text-slate-900 tabular-nums">
              {session.flaggedIds.length}
            </span>
          </div>
        </div>
      </ConfirmModal>
    </div>
  );
};
