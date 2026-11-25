import React from 'react';
import { cn } from '../../utils/formatters';

type BadgeTone = 'neutral' | 'info' | 'success' | 'danger' | 'warning';

interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-700 border-slate-200/80',
  info: 'bg-indigo-50 text-indigo-700 border-indigo-200/70',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
  danger: 'bg-rose-50 text-rose-700 border-rose-200/70',
  warning: 'bg-amber-50 text-amber-800 border-amber-200/80',
};

export const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', children, className }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md border',
        TONE_CLASSES[tone],
        className
      )}
    >
      {children}
    </span>
  );
};
