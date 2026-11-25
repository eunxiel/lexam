import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Play,
  Search,
  XCircle,
} from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { cn } from '../../utils/formatters';

type StatusFilter = 'all' | 'unanswered' | 'correct' | 'incorrect' | 'verify';

interface QuestionBankViewProps {
  onPracticeQuestion: (subjectId: string, questionId: string) => void;
}

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({
  onPracticeQuestion,
}) => {
  const { state, getAllLoadedQuestions, getSubjectById } = useAppState();
  const [query, setQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const allQuestions = useMemo(() => getAllLoadedQuestions(), [getAllLoadedQuestions]);

  const filteredQuestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return allQuestions.filter((question) => {
      if (selectedSubjectId !== 'all' && question.subjectId !== selectedSubjectId) {
        return false;
      }

      const progress = state.questionProgress[question.id];
      const needsVerify = Boolean(question.needsVerification || question.correctAnswer === null);

      if (statusFilter === 'unanswered' && progress) return false;
      if (statusFilter === 'correct' && progress?.isCorrect !== true) return false;
      if (statusFilter === 'incorrect' && progress?.isCorrect !== false) return false;
      if (statusFilter === 'verify' && !needsVerify) return false;

      if (!normalized) return true;

      const haystack = [
        question.id,
        question.text,
        question.options.A,
        question.options.B,
        question.options.C,
        question.options.D,
        question.source?.fileName ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [allQuestions, query, selectedSubjectId, statusFilter, state.questionProgress]);

  const clearFilters = () => {
    setQuery('');
    setSelectedSubjectId('all');
    setStatusFilter('all');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Question Bank
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Search across all loaded questions without spoiling answer keys. Select any item to open it directly in Practice Mode.
        </p>
      </div>

      {/* Search & Filters */}
      <Card padding="md" className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by question text, option keyword, ID, or source filename..."
            aria-label="Search questions"
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none transition-colors"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Subject Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedSubjectId('all')}
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                selectedSubjectId === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              )}
            >
              All Subjects
            </button>
            {state.subjects.map((subject) => (
              <button
                key={subject.id}
                type="button"
                onClick={() => setSelectedSubjectId(subject.id)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                  selectedSubjectId === subject.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                )}
              >
                {subject.name}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ['all', 'All'],
                ['unanswered', 'Unanswered'],
                ['correct', 'Correct'],
                ['incorrect', 'Incorrect'],
                ['verify', 'Needs Verification'],
              ] as Array<[StatusFilter, string]>
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={cn(
                  'rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
                  statusFilter === value
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing <strong className="font-semibold text-slate-800">{filteredQuestions.length}</strong> of{' '}
          {allQuestions.length} questions
        </span>
        {(query || selectedSubjectId !== 'all' || statusFilter !== 'all') && (
          <button
            type="button"
            onClick={clearFilters}
            className="font-medium text-slate-700 hover:text-slate-900 underline underline-offset-2"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Question List */}
      {filteredQuestions.length === 0 ? (
        <EmptyState
          icon={<Search className="h-5 w-5" />}
          title="No matching questions"
          description="Try adjusting your search query or clearing the active subject and status filters."
          action={
            <Button variant="secondary" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredQuestions.map((question) => {
            const subject = getSubjectById(question.subjectId);
            const progress = state.questionProgress[question.id];
            const needsVerify = Boolean(question.needsVerification || question.correctAnswer === null);

            return (
              <Card
                key={question.id}
                padding="md"
                className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="neutral">{subject?.name ?? question.subjectId}</Badge>
                    <span className="font-mono text-[11px] text-slate-400">
                      {question.id}
                    </span>
                    {question.isPlaceholder && <Badge tone="neutral">Placeholder</Badge>}
                    {needsVerify && (
                      <Badge tone="warning">
                        <AlertTriangle className="h-3 w-3" />
                        Needs Verification
                      </Badge>
                    )}
                    {progress ? (
                      progress.isCorrect === true ? (
                        <Badge tone="success">
                          <CheckCircle2 className="h-3 w-3" />
                          Correct
                        </Badge>
                      ) : progress.isCorrect === false ? (
                        <Badge tone="danger">
                          <XCircle className="h-3 w-3" />
                          Incorrect
                        </Badge>
                      ) : (
                        <Badge tone="warning">Answered (Unverified)</Badge>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <Circle className="h-3 w-3" />
                        Unanswered
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-800 leading-relaxed">{question.text}</p>

                  {question.verificationNote && (
                    <p className="text-xs text-amber-700 bg-amber-50/70 border border-amber-200/70 rounded-lg px-2.5 py-1.5">
                      {question.verificationNote}
                    </p>
                  )}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onPracticeQuestion(question.subjectId, question.id)}
                  className="shrink-0 self-start"
                >
                  <Play className="h-3.5 w-3.5" />
                  Practice
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
