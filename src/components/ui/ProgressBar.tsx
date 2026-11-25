import React from 'react';
import { cn } from '../../utils/formatters';

type ProgressTone = 'slate' | 'indigo' | 'emerald' | 'amber';

interface ProgressBarProps {
  value: number;
  tone?: ProgressTone;
  size?: 'sm' | 'md';
  className?: string;
}

const TONE_CLASSES: Record<ProgressTone, string> = {
  slate: 'bg-slate-900',
  indigo: 'bg-indigo-600',
  emerald: 'bg-emerald-600',
  amber: 'bg-amber-500',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  tone = 'slate',
  size = 'sm',
  className,
}) => {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-full bg-slate-100',
        size === 'sm' ? 'h-1.5' : 'h-2',
        className
      )}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          'h-full rounded-full transition-all duration-300 ease-out',
          TONE_CLASSES[tone]
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};
