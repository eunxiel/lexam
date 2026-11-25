import React from 'react';
import { Flag, RotateCcw } from 'lucide-react';
import type { OptionKey, PracticeMode, Question } from '../../types/exam';
import { cn } from '../../utils/formatters';
import { Button } from '../ui/Button';

interface QuestionNavigatorProps {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, OptionKey>;
  flaggedIds: string[];
  mode: PracticeMode;
  onJumpTo: (index: number) => void;
  onFinishClick: () => void;
  onRestartClick: () => void;
}

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  questions,
  currentIndex,
  answers,
  flaggedIds,
  mode,
  onJumpTo,
  onFinishClick,
  onRestartClick,
}) => {
  const answeredCount = questions.filter((q) => Boolean(answers[q.id])).length;
  const unansweredCount = questions.length - answeredCount;
  const flaggedCount = flaggedIds.length;

  let correctCount = 0;
  let incorrectCount = 0;
  if (mode === 'practice') {
    for (const q of questions) {
      const selected = answers[q.id];
      if (selected && q.correctAnswer !== null) {
        if (selected === q.correctAnswer) correctCount += 1;
        else incorrectCount += 1;
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Question Navigator
          </h2>
          <span className="text-xs font-medium text-slate-500 tabular-nums">
            {answeredCount}/{questions.length}
          </span>
        </div>

        {/* Summary Counters */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2">
            <span className="block text-[11px] text-slate-500">Answered</span>
            <span className="font-semibold text-slate-900 tabular-nums">{answeredCount}</span>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2">
            <span className="block text-[11px] text-slate-500">Unanswered</span>
            <span className="font-semibold text-slate-900 tabular-nums">{unansweredCount}</span>
          </div>
          {mode === 'practice' ? (
            <>
              <div className="rounded-lg bg-emerald-50/60 border border-emerald-100 px-2.5 py-2">
                <span className="block text-[11px] text-emerald-700">Correct</span>
                <span className="font-semibold text-emerald-800 tabular-nums">{correctCount}</span>
              </div>
              <div className="rounded-lg bg-rose-50/60 border border-rose-100 px-2.5 py-2">
                <span className="block text-[11px] text-rose-700">Incorrect</span>
                <span className="font-semibold text-rose-800 tabular-nums">{incorrectCount}</span>
              </div>
            </>
          ) : (
            flaggedCount > 0 && (
              <div className="col-span-2 flex items-center justify-between rounded-lg bg-amber-50/70 border border-amber-200/70 px-2.5 py-1.5 text-amber-800">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium">
                  <Flag className="h-3 w-3 fill-current" />
                  Flagged for review
                </span>
                <span className="font-semibold tabular-nums">{flaggedCount}</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Number Grid */}
      <div className="grid grid-cols-5 gap-2 max-h-[360px] overflow-y-auto p-0.5 pr-1">
        {questions.map((question, idx) => {
          const isCurrent = idx === currentIndex;
          const selected = answers[question.id];
          const isFlagged = flaggedIds.includes(question.id);

          let tileClass =
            'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50';

          if (selected) {
            if (mode === 'exam') {
              tileClass = 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800';
            } else if (question.correctAnswer === null) {
              tileClass = 'border-amber-300 bg-amber-50 text-amber-800';
            } else if (selected === question.correctAnswer) {
              tileClass = 'border-emerald-300 bg-emerald-50 text-emerald-800';
            } else {
              tileClass = 'border-rose-300 bg-rose-50 text-rose-800';
            }
          }

          return (
            <button
              key={question.id}
              type="button"
              onClick={() => onJumpTo(idx)}
              aria-label={`Go to question ${idx + 1}${isFlagged ? ', flagged' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
              className={cn(
                'relative flex h-9 items-center justify-center rounded-lg border text-xs font-semibold tabular-nums transition-all duration-150',
                tileClass,
                isCurrent && 'ring-2 ring-slate-900 ring-offset-1'
              )}
            >
              {idx + 1}
              {isFlagged && (
                <span
                  aria-hidden="true"
                  className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-amber-500"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
        {mode === 'practice' ? (
          <>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs border border-emerald-400 bg-emerald-100" />
              Correct
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs border border-rose-400 bg-rose-100" />
              Incorrect
            </span>
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-slate-900" />
            Answered
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-xs border border-slate-300 bg-white" />
          Unanswered
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          Flagged
        </span>
      </div>

      <div className="space-y-2">
        <Button
          variant={mode === 'exam' ? 'primary' : 'secondary'}
          fullWidth
          onClick={onFinishClick}
        >
          {mode === 'exam' ? 'Submit Exam' : 'Finish Practice'}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          fullWidth
          onClick={onRestartClick}
          className="text-slate-500 hover:text-rose-600 hover:bg-rose-50/70"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Restart from Question 1
        </Button>
      </div>
    </div>
  );
};
