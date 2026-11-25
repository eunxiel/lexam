import React from 'react';
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  Play,
  Settings,
} from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import type { ActiveSession, AppView } from '../../types/exam';
import { cn } from '../../utils/formatters';

interface AppShellProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onResumeSession: (session: ActiveSession) => void;
  children: React.ReactNode;
}

const NAV_ITEMS: Array<{ id: AppView; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'bank', label: 'Question Bank', icon: BookOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const AppShell: React.FC<AppShellProps> = ({
  currentView,
  onNavigate,
  onResumeSession,
  children,
}) => {
  const { getMostRecentActiveSession, getSubjectById } = useAppState();
  const activeSession = getMostRecentActiveSession();
  const activeSubject = activeSession ? getSubjectById(activeSession.subjectId) : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FB] text-slate-900">
      <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-xs border-b border-slate-200/80">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white transition-transform duration-150 group-hover:scale-[1.02]">
                <GraduationCap className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <span className="block text-sm font-semibold tracking-tight text-slate-900">
                  Lexam
                </span>
                <span className="hidden sm:block text-[11px] text-slate-500">
                  Exam Practice Studio
                </span>
              </div>
            </button>

            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
                const isActive = currentView === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onNavigate(id)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150',
                      isActive
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', isActive ? 'text-slate-900' : 'text-slate-400')} />
                    {label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            {activeSession && activeSubject && (
              <button
                type="button"
                onClick={() => onResumeSession(activeSession)}
                className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100/70 transition-colors"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span className="hidden sm:inline">
                  Resume {activeSubject.name}
                </span>
                <span className="sm:hidden">Resume</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile navigation bar */}
      <nav
        className="flex md:hidden items-center justify-around border-b border-slate-200/80 bg-white px-2 py-1.5"
        aria-label="Mobile navigation"
      >
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = currentView === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
};
