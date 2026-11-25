import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Info,
  MinusCircle,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { OPTION_KEYS, type PracticeMode, type SessionResult } from '../../types/exam';
import {
  cn,
  formatReadableDuration,
  formatShortDate,
  resolveAssetUrl,
} from '../../utils/formatters';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { ProgressBar } from '../ui/ProgressBar';

type ReviewFilter = 'all' | 'correct' | 'incorrect' | 'unanswered';

interface ResultsViewProps {
  result: SessionResult;
  onRetry: (subjectId: string, mode: PracticeMode) => void;
  onBackToDashboard: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  result,
  onRetry,
  onBackToDashboard,
}) => {
  const { getQuestionById } = useAppState();
  const [filter, setFilter] = useState<ReviewFilter>('all');

  const gradableTotal = result.totalQuestions - result.unverifiedCount;

  const filteredItems = useMemo(() => {
    return result.answers
      .map((snapshot, index) => ({
        index,
        snapshot,
        question: getQuestionById(snapshot.questionId),
      }))
      .filter(({ snapshot }) => {
        if (filter === 'all') return true;
        if (filter === 'correct') return snapshot.isCorrect === true;
        if (filter === 'incorrect') return snapshot.isCorrect === false;
        if (filter === 'unanswered') return snapshot.selectedAnswer === null;
        return true;
      });
  }, [result.answers, filter, getQuestionById]);

  const filterTabs: Array<{ id: ReviewFilter; label: string; count: number }> = [
    { id: 'all', label: 'All Questions', count: result.totalQuestions },
    { id: 'correct', label: 'Correct', count: result.correctCount },
    { id: 'incorrect', label: 'Incorrect', count: result.incorrectCount },
    { id: 'unanswered', label: 'Unanswered', count: result.unansweredCount },
  ];

  return (
    <div className="space-y-8">
      {/* Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={result.mode === 'exam' ? 'info' : 'neutral'}>
              {result.mode === 'exam' ? 'Exam Results' : 'Practice Summary'}
            </Badge>
            <span className="text-xs text-slate-400">
              {formatShortDate(result.completedAt)}
            </span>
          </div>
          <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-900">
            {result.subjectName}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="secondary" onClick={onBackToDashboard}>
            <ArrowLeft className="h-4 w-4" />
            Return to Dashboard
          </Button>
          <Button
            variant="primary"
            onClick={() => onRetry(result.subjectId, result.mode)}
          >
            <RotateCcw className="h-4 w-4" />
            Retry Session
          </Button>
        </div>
      </div>

      {/* Score & Breakdown Summary */}
      <Card padding="lg" className="space-y-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Final Score
            </span>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-4xl font-semibold tracking-tight text-slate-900 tabular-nums">
                {result.accuracyPercent}%
              </span>
              <span className="text-sm font-medium text-slate-500 tabular-nums">
                {result.correctCount} / {gradableTotal} graded correct
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200/80 px-3.5 py-2 text-xs font-medium text-slate-700 tabular-nums self-start sm:self-auto">
            <Clock className="h-4 w-4 text-slate-400" />
            Time spent: <strong className="text-slate-900">{formatReadableDuration(result.durationSeconds)}</strong>
          </div>
        </div>

        <ProgressBar
          value={result.accuracyPercent}
          tone={
            result.accuracyPercent >= 75
              ? 'emerald'
              : result.accuracyPercent >= 50
                ? 'indigo'
                : 'amber'
          }
          size="md"
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
            <span className="block text-xs text-slate-500">Total Questions</span>
            <span className="mt-1 block text-lg font-semibold text-slate-900 tabular-nums">
              {result.totalQuestions}
            </span>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5">
            <span className="block text-xs text-emerald-700">Correct</span>
            <span className="mt-1 block text-lg font-semibold text-emerald-800 tabular-nums">
              {result.correctCount}
            </span>
          </div>
          <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3.5">
            <span className="block text-xs text-rose-700">Incorrect</span>
            <span className="mt-1 block text-lg font-semibold text-rose-800 tabular-nums">
              {result.incorrectCount}
            </span>
          </div>
          <div className="rounded-xl border border-slate-200/70 bg-white p-3.5">
            <span className="block text-xs text-slate-500">Unanswered</span>
            <span className="mt-1 block text-lg font-semibold text-slate-900 tabular-nums">
              {result.unansweredCount}
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5">
            <span className="block text-xs text-indigo-700">Accuracy</span>
            <span className="mt-1 block text-lg font-semibold text-indigo-900 tabular-nums">
              {result.accuracyPercent}%
            </span>
          </div>
        </div>

        {result.unverifiedCount > 0 && (
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/70 px-3.5 py-2.5 text-xs text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <span>
              {result.unverifiedCount} question{result.unverifiedCount === 1 ? '' : 's'} in this
              session had no verified answer key and {result.unverifiedCount === 1 ? 'was' : 'were'}{' '}
              excluded from the graded score denominator.
            </span>
          </div>
        )}
      </Card>

      {/* Question-by-Question Review */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Question-by-Question Review
            </h2>
            <p className="text-xs text-slate-500">
              Inspect your selections alongside verified answer keys and explanations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={cn(
                  'rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors tabular-nums',
                  filter === tab.id
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                )}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="No questions in this category"
            description="Select another filter tab above to inspect the rest of your answers."
            action={
              <Button variant="secondary" size="sm" onClick={() => setFilter('all')}>
                Show All Questions
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredItems.map(({ index, snapshot, question }) => {
              const isUnanswered = snapshot.selectedAnswer === null;
              const isUnverified = snapshot.correctAnswer === null;

              return (
                <Card key={`${snapshot.questionId}-${index}`} padding="lg" className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 tabular-nums">
                      Question {index + 1}
                    </span>

                    <div className="flex items-center gap-2">
                      {isUnverified ? (
                        <Badge tone="warning">
                          <AlertTriangle className="h-3 w-3" />
                          Pending Verification
                        </Badge>
                      ) : isUnanswered ? (
                        <Badge tone="neutral">
                          <MinusCircle className="h-3 w-3" />
                          Unanswered
                        </Badge>
                      ) : snapshot.isCorrect ? (
                        <Badge tone="success">
                          <CheckCircle2 className="h-3 w-3" />
                          Correct
                        </Badge>
                      ) : (
                        <Badge tone="danger">
                          <XCircle className="h-3 w-3" />
                          Incorrect
                        </Badge>
                      )}
                    </div>
                  </div>

                  {question ? (
                    <>
                      <p className="text-sm sm:text-[15px] font-medium text-slate-900 leading-relaxed whitespace-pre-line">
                        {question.text}
                      </p>

                      {question.codeBlock && (
                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/90 p-3.5">
                          <pre className="font-mono text-xs leading-5 text-slate-800 whitespace-pre">
                            {question.codeBlock}
                          </pre>
                        </div>
                      )}

                      {question.table && (
                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                          <table className="w-full border-collapse text-left text-xs">
                            {question.table.headers.length > 0 && (
                              <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                  {question.table.headers.map((header, hIdx) => (
                                    <th
                                      key={hIdx}
                                      className="px-3 py-1.5 font-semibold text-slate-700 border-r last:border-r-0 border-slate-200"
                                    >
                                      {header}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                            )}
                            <tbody className="divide-y divide-slate-200">
                              {question.table.rows.map((row, rIdx) => (
                                <tr key={rIdx}>
                                  {row.map((cell, cIdx) => (
                                    <td
                                      key={cIdx}
                                      className="px-3 py-1.5 text-slate-700 border-r last:border-r-0 border-slate-200 font-mono"
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

                      {question.imageUrl && (
                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-3">
                          <img
                            src={resolveAssetUrl(question.imageUrl)}
                            alt={question.imageAlt || `Figure for question ${index + 1}`}
                            className="mx-auto max-h-64 w-auto rounded-lg object-contain"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        {OPTION_KEYS.map((key) => {
                          const isUserChoice = snapshot.selectedAnswer === key;
                          const isCorrectChoice = snapshot.correctAnswer === key;
                          const optionImage = question.optionImages?.[key];

                          let rowClass = 'border-slate-200/80 bg-white text-slate-600';
                          let letterClass = 'border-slate-200 bg-slate-50 text-slate-500';
                          let tag: React.ReactNode = null;

                          if (isCorrectChoice && isUserChoice) {
                            rowClass = 'border-emerald-400 bg-emerald-50/70 text-emerald-950';
                            letterClass = 'border-emerald-600 bg-emerald-600 text-white';
                            tag = (
                              <span className="text-xs font-semibold text-emerald-700 shrink-0">
                                Your Answer &middot; Correct
                              </span>
                            );
                          } else if (isCorrectChoice) {
                            rowClass = 'border-emerald-400 bg-emerald-50/50 text-emerald-950';
                            letterClass = 'border-emerald-600 bg-emerald-600 text-white';
                            tag = (
                              <span className="text-xs font-semibold text-emerald-700 shrink-0">
                                Correct Answer
                              </span>
                            );
                          } else if (isUserChoice && !isUnverified) {
                            rowClass = 'border-rose-300 bg-rose-50/70 text-rose-950';
                            letterClass = 'border-rose-600 bg-rose-600 text-white';
                            tag = (
                              <span className="text-xs font-semibold text-rose-700 shrink-0">
                                Your Answer
                              </span>
                            );
                          } else if (isUserChoice && isUnverified) {
                            rowClass = 'border-amber-300 bg-amber-50/70 text-amber-950';
                            letterClass = 'border-amber-500 bg-amber-500 text-white';
                            tag = (
                              <span className="text-xs font-semibold text-amber-800 shrink-0">
                                Your Answer
                              </span>
                            );
                          }

                          return (
                            <div
                              key={key}
                              className={cn(
                                'flex items-start justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-sm',
                                rowClass
                              )}
                            >
                              <div className="flex items-start gap-3 min-w-0 flex-1">
                                <span
                                  className={cn(
                                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-semibold',
                                    letterClass
                                  )}
                                >
                                  {key}
                                </span>
                                <div className="min-w-0 flex-1 space-y-2">
                                  <span className="block leading-relaxed">{question.options[key]}</span>
                                  {optionImage && (
                                    <div className="rounded-lg border border-slate-200/80 bg-white p-2 inline-block max-w-full overflow-x-auto">
                                      <img
                                        src={resolveAssetUrl(optionImage)}
                                        alt={`Ilustrasi pilihan ${key}`}
                                        className="max-h-36 w-auto object-contain"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                              {tag && <div className="pt-0.5">{tag}</div>}
                            </div>
                          );
                        })}
                      </div>

                      {question.verificationNote && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3.5 py-2.5 text-xs text-amber-900">
                          {question.verificationNote}
                        </div>
                      )}

                      {question.explanation ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            <Info className="h-3.5 w-3.5" />
                            Explanation
                          </div>
                          <p className="mt-1 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                            {question.explanation}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">
                          No explanation provided for this question.
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Question data ({snapshot.questionId}) is no longer in the active question bank.
                      Selected: {snapshot.selectedAnswer ?? 'None'} &middot; Correct:{' '}
                      {snapshot.correctAnswer ?? 'Unverified'}.
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
