import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { OptionKey, PracticeMode } from '../../types/exam';
import { cn, resolveAssetUrl } from '../../utils/formatters';

interface OptionCardProps {
  optionKey: OptionKey;
  text: string;
  imageUrl?: string;
  mode: PracticeMode;
  isSelected: boolean;
  isRevealed: boolean;
  isCorrectOption: boolean;
  isUnverifiedQuestion: boolean;
  disabled: boolean;
  onSelect: (key: OptionKey) => void;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  optionKey,
  text,
  imageUrl,
  mode,
  isSelected,
  isRevealed,
  isCorrectOption,
  isUnverifiedQuestion,
  disabled,
  onSelect,
}) => {
  // Determine visual state carefully so we NEVER reveal answer keys before selection
  let containerClass =
    'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 text-slate-800';
  let badgeClass = 'border-slate-200 bg-slate-50 text-slate-600';
  let statusBadge: React.ReactNode = null;

  if (mode === 'exam') {
    if (isSelected) {
      containerClass =
        'border-slate-900 bg-slate-900/[0.03] text-slate-900 ring-1 ring-slate-900/10';
      badgeClass = 'border-slate-900 bg-slate-900 text-white';
      statusBadge = (
        <span className="text-xs font-medium text-slate-700 shrink-0">Selected</span>
      );
    }
  } else if (isRevealed) {
    if (isUnverifiedQuestion) {
      if (isSelected) {
        containerClass = 'border-amber-400 bg-amber-50/70 text-slate-900';
        badgeClass = 'border-amber-500 bg-amber-500 text-white';
        statusBadge = (
          <span className="text-xs font-medium text-amber-800 shrink-0">Your Answer</span>
        );
      } else {
        containerClass = 'border-slate-200 bg-white text-slate-500 opacity-70';
      }
    } else if (isCorrectOption && isSelected) {
      containerClass =
        'border-emerald-500 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-500/20';
      badgeClass = 'border-emerald-600 bg-emerald-600 text-white';
      statusBadge = (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 shrink-0">
          <CheckCircle2 className="h-4 w-4" />
          Correct
        </span>
      );
    } else if (isSelected && !isCorrectOption) {
      containerClass =
        'border-rose-400 bg-rose-50/70 text-rose-950 ring-1 ring-rose-400/20';
      badgeClass = 'border-rose-600 bg-rose-600 text-white';
      statusBadge = (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 shrink-0">
          <XCircle className="h-4 w-4" />
          Incorrect
        </span>
      );
    } else if (isCorrectOption) {
      containerClass =
        'border-emerald-400 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-400/20';
      badgeClass = 'border-emerald-600 bg-emerald-600 text-white';
      statusBadge = (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 shrink-0">
          <CheckCircle2 className="h-4 w-4" />
          Correct Answer
        </span>
      );
    } else {
      containerClass = 'border-slate-200/80 bg-white text-slate-500 opacity-65';
    }
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(optionKey)}
      aria-pressed={isSelected}
      className={cn(
        'group w-full rounded-xl border p-4 text-left transition-all duration-150',
        'flex items-start justify-between gap-3.5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:ring-offset-1',
        disabled && 'cursor-default',
        containerClass
      )}
    >
      <div className="flex items-start gap-3.5 min-w-0 flex-1">
        <span
          className={cn(
            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold transition-colors',
            badgeClass
          )}
        >
          {optionKey}
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <span className="block text-sm sm:text-[15px] leading-relaxed pt-0.5 break-words">
            {text}
          </span>
          {imageUrl && (
            <div className="rounded-lg border border-slate-200/80 bg-white p-2.5 inline-block max-w-full overflow-x-auto">
              <img
                src={resolveAssetUrl(imageUrl)}
                alt={`Ilustrasi pilihan ${optionKey}`}
                className="max-h-44 w-auto object-contain"
              />
            </div>
          )}
        </div>
      </div>

      {statusBadge && <div className="pt-1">{statusBadge}</div>}
    </button>
  );
};
