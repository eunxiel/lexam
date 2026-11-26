import React from 'react';
import { Card } from '../ui/Card';
import { cn } from '../../utils/formatters';

interface MetricCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: React.ReactNode;
  accent?: 'neutral' | 'emerald' | 'indigo';
}

const ICON_BG = {
  neutral: 'bg-slate-100 text-slate-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  indigo: 'bg-indigo-50 text-indigo-600',
};

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  sublabel,
  icon,
  accent = 'neutral',
}) => {
  return (
    <Card padding="none" className="flex flex-col justify-between p-3 sm:p-5 min-w-0">
      <div className="flex items-center justify-between gap-1.5 sm:gap-2">
        <span className="text-[11px] sm:text-xs font-medium text-slate-500 truncate">{label}</span>
        <div
          className={cn(
            'flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg',
            ICON_BG[accent]
          )}
        >
          {icon}
        </div>
      </div>
      <div className="mt-2 sm:mt-3">
        <div className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
          {value}
        </div>
        {sublabel && (
          <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 truncate">{sublabel}</p>
        )}
      </div>
    </Card>
  );
};
