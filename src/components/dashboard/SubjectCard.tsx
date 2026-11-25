import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  ClipboardCheck,
  Pencil,
  Play,
  RotateCcw,
  Upload,
  X,
} from 'lucide-react';
import type { ActiveSession, PracticeMode, Subject, SubjectStats } from '../../types/exam';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';

interface SubjectCardProps {
  subject: Subject;
  stats: SubjectStats;
  activePracticeSession?: ActiveSession;
  activeExamSession?: ActiveSession;
  onStartMode: (subjectId: string, mode: PracticeMode) => void;
  onRestartSubject: (subjectId: string) => void;
  onRenameSubject: (subjectId: string, newName: string) => void;
  onGoToImport: (subjectId: string) => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  stats,
  activePracticeSession,
  activeExamSession,
  onStartMode,
  onRestartSubject,
  onRenameSubject,
  onGoToImport,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(subject.name);

  const handleSaveName = () => {
    const trimmed = draftName.trim();
    if (trimmed) {
      onRenameSubject(subject.id, trimmed);
    } else {
      setDraftName(subject.name);
    }
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setDraftName(subject.name);
    setIsEditingName(false);
  };

  const hasQuestions = stats.totalQuestions > 0;
  const allPlaceholders = hasQuestions && stats.placeholderCount === stats.totalQuestions;

  return (
    <Card padding="lg" interactive className="flex flex-col justify-between gap-5">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {subject.code}
              </span>
              {allPlaceholders && (
                <Badge tone="neutral">Placeholder Bank</Badge>
              )}
              {stats.unverifiedQuestions > 0 && (
                <Badge tone="warning">
                  <AlertTriangle className="h-3 w-3" />
                  {stats.unverifiedQuestions} to verify
                </Badge>
              )}
            </div>

            {isEditingName ? (
              <div className="mt-2 flex items-center gap-1.5">
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  autoFocus
                  aria-label="Subject name"
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-sm font-semibold text-slate-900 focus:border-slate-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  aria-label="Save subject name"
                  className="rounded-lg bg-slate-900 p-1.5 text-white hover:bg-slate-800"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  aria-label="Cancel rename"
                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-50"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="mt-1.5 flex items-center gap-2">
                <h3 className="truncate text-base font-semibold text-slate-900">
                  {subject.name}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setDraftName(subject.name);
                    setIsEditingName(true);
                  }}
                  title="Rename subject"
                  aria-label={`Rename ${subject.name}`}
                  className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {subject.description}
            </p>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="mt-5 grid grid-cols-3 gap-3 rounded-lg bg-slate-50/90 border border-slate-100 p-3">
          <div>
            <span className="block text-[11px] font-medium text-slate-500">Questions</span>
            <span className="mt-0.5 block text-sm font-semibold text-slate-900 tabular-nums">
              {stats.totalQuestions}
            </span>
          </div>
          <div>
            <span className="block text-[11px] font-medium text-slate-500">Completed</span>
            <span className="mt-0.5 block text-sm font-semibold text-slate-900 tabular-nums">
              {stats.completedQuestions}
            </span>
          </div>
          <div>
            <span className="block text-[11px] font-medium text-slate-500">Accuracy</span>
            <span className="mt-0.5 block text-sm font-semibold text-slate-900 tabular-nums">
              {stats.completedQuestions > 0 ? `${stats.accuracyPercent}%` : '—'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-600">Progress</span>
            <span className="font-semibold text-slate-900 tabular-nums">
              {stats.progressPercent}%
            </span>
          </div>
          <ProgressBar
            value={stats.progressPercent}
            tone={stats.progressPercent === 100 ? 'emerald' : 'slate'}
          />
        </div>
      </div>

      {/* Actions */}
      {hasQuestions ? (
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              onClick={() => onStartMode(subject.id, 'practice')}
            >
              {activePracticeSession ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5" />
                  Resume Practice
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Start Practice
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={() => onStartMode(subject.id, 'exam')}
            >
              <ClipboardCheck className="h-3.5 w-3.5" />
              {activeExamSession ? 'Resume Exam' : 'Exam Mode'}
            </Button>
          </div>

          {(stats.completedQuestions > 0 || activePracticeSession || activeExamSession) && (
            <button
              type="button"
              onClick={() => onRestartSubject(subject.id)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 transition-colors pt-0.5"
            >
              <RotateCcw className="h-3 w-3" />
              Mulai ulang dari awal (hapus semua jawaban)
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-3.5 py-2.5">
          <span className="text-xs text-slate-500">No questions added yet.</span>
          <Button variant="secondary" size="sm" onClick={() => onGoToImport(subject.id)}>
            <Upload className="h-3.5 w-3.5" />
            Import Bank
          </Button>
        </div>
      )}
    </Card>
  );
};
