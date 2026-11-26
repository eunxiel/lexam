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
    <Card
      padding="none"
      interactive
      className="flex flex-col justify-between gap-3 sm:gap-5 p-3 sm:p-6 min-w-0"
    >
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400">
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
              <div className="mt-2 flex items-center gap-1">
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
                  className="min-w-0 w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs sm:text-sm font-semibold text-slate-900 focus:border-slate-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  aria-label="Save subject name"
                  className="shrink-0 rounded-lg bg-slate-900 p-1.5 text-white hover:bg-slate-800"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  aria-label="Cancel rename"
                  className="shrink-0 rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-50"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="mt-1 sm:mt-1.5 flex items-start sm:items-center gap-1 sm:gap-2">
                <h3 className="line-clamp-2 sm:truncate text-sm sm:text-base font-semibold text-slate-900 leading-snug">
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
                  className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </button>
              </div>
            )}

            <p className="mt-1 hidden sm:line-clamp-2 text-xs text-slate-500 leading-relaxed">
              {subject.description}
            </p>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="mt-3 sm:mt-5 grid grid-cols-3 gap-1 sm:gap-3 rounded-lg bg-slate-50/90 border border-slate-100 p-2 sm:p-3 text-center sm:text-left">
          <div className="min-w-0">
            <span className="block text-[10px] sm:text-[11px] font-medium text-slate-500 truncate">
              <span className="sm:hidden">Soal</span>
              <span className="hidden sm:inline">Questions</span>
            </span>
            <span className="mt-0.5 block text-xs sm:text-sm font-semibold text-slate-900 tabular-nums">
              {stats.totalQuestions}
            </span>
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] sm:text-[11px] font-medium text-slate-500 truncate">
              <span className="sm:hidden">Selesai</span>
              <span className="hidden sm:inline">Completed</span>
            </span>
            <span className="mt-0.5 block text-xs sm:text-sm font-semibold text-slate-900 tabular-nums">
              {stats.completedQuestions}
            </span>
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] sm:text-[11px] font-medium text-slate-500 truncate">
              <span className="sm:hidden">Akurasi</span>
              <span className="hidden sm:inline">Accuracy</span>
            </span>
            <span className="mt-0.5 block text-xs sm:text-sm font-semibold text-slate-900 tabular-nums">
              {stats.completedQuestions > 0 ? `${stats.accuracyPercent}%` : '—'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-2.5 sm:mt-4">
          <div className="flex items-center justify-between text-[11px] sm:text-xs mb-1 sm:mb-1.5">
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
        <div className="space-y-1.5 sm:space-y-2 pt-2 sm:pt-1 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-1.5 sm:gap-2">
            <Button
              variant="primary"
              size="sm"
              className="w-full sm:flex-1 sm:h-9 sm:px-3.5 sm:text-sm"
              onClick={() => onStartMode(subject.id, 'practice')}
            >
              {activePracticeSession ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Resume Practice</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 shrink-0 fill-current" />
                  <span className="truncate">Start Practice</span>
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="w-full sm:flex-1 sm:h-9 sm:px-3.5 sm:text-sm"
              onClick={() => onStartMode(subject.id, 'exam')}
            >
              <ClipboardCheck className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {activeExamSession ? 'Resume Exam' : 'Exam Mode'}
              </span>
            </Button>
          </div>

          {(stats.completedQuestions > 0 || activePracticeSession || activeExamSession) && (
            <button
              type="button"
              onClick={() => onRestartSubject(subject.id)}
              className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-medium text-slate-500 hover:text-rose-600 transition-colors pt-0.5 text-left"
            >
              <RotateCcw className="h-3 w-3 shrink-0" />
              <span className="sm:hidden">Mulai ulang</span>
              <span className="hidden sm:inline">Mulai ulang dari awal (hapus semua jawaban)</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-2.5 py-2 sm:px-3.5 sm:py-2.5">
          <span className="text-[11px] sm:text-xs text-slate-500">No questions yet.</span>
          <Button variant="secondary" size="sm" onClick={() => onGoToImport(subject.id)}>
            <Upload className="h-3.5 w-3.5" />
            Import
          </Button>
        </div>
      )}
    </Card>
  );
};
