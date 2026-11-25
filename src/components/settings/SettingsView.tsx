import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Download,
  FileJson,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import type { PracticeMode } from '../../types/exam';
import {
  createQuestionImportTemplate,
  parseAndValidateQuestionImport,
  type ImportValidationResult,
} from '../../utils/questionImporter';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ConfirmModal } from '../ui/ConfirmModal';

interface SettingsViewProps {
  initialImportSubjectId?: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ initialImportSubjectId }) => {
  const {
    state,
    getSubjectStats,
    renameSubject,
    addSubject,
    deleteSubject,
    importQuestionsForSubject,
    clearCustomQuestionsForSubject,
    updatePreferences,
    resetSubjectProgress,
    resetAllProgress,
  } = useAppState();

  // Subject edit drafts
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Add Subject form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Question Bank Importer state
  const [importSubjectId, setImportSubjectId] = useState(
    initialImportSubjectId || state.subjects[0]?.id || 'subject-01'
  );
  const [rawJson, setRawJson] = useState('');
  const [hidePlaceholders, setHidePlaceholders] = useState(true);
  const [replaceExistingCustom, setReplaceExistingCustom] = useState(true);
  const [validation, setValidation] = useState<ImportValidationResult | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // Confirm modals
  const [confirmResetAll, setConfirmResetAll] = useState(false);
  const [resetTargetSubjectId, setResetTargetSubjectId] = useState<string | null>(null);
  const [deleteTargetSubjectId, setDeleteTargetSubjectId] = useState<string | null>(null);

  useEffect(() => {
    if (initialImportSubjectId) {
      setImportSubjectId(initialImportSubjectId);
    }
  }, [initialImportSubjectId]);

  useEffect(() => {
    if (!state.subjects.some((s) => s.id === importSubjectId) && state.subjects[0]) {
      setImportSubjectId(state.subjects[0].id);
    }
  }, [state.subjects, importSubjectId]);

  const startEditingSubject = (subjectId: string) => {
    const subject = state.subjects.find((s) => s.id === subjectId);
    if (!subject) return;
    setEditingSubjectId(subject.id);
    setEditName(subject.name);
    setEditCode(subject.code);
    setEditDesc(subject.description);
  };

  const handleSaveSubject = (subjectId: string) => {
    if (!editName.trim()) return;
    renameSubject(subjectId, {
      name: editName,
      code: editCode,
      description: editDesc,
    });
    setEditingSubjectId(null);
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const created = addSubject({
      name: newName,
      code: newCode || `SUBJ-0${state.subjects.length + 1}`,
      description: newDesc,
    });
    setImportSubjectId(created.id);
    setNewName('');
    setNewCode('');
    setNewDesc('');
    setShowAddForm(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      setRawJson(content);
      setImportSuccessMessage(null);
      setValidation(parseAndValidateQuestionImport(content, importSubjectId));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleValidateJson = () => {
    setImportSuccessMessage(null);
    setValidation(parseAndValidateQuestionImport(rawJson, importSubjectId));
  };

  const handleConfirmImport = () => {
    const result = parseAndValidateQuestionImport(rawJson, importSubjectId);
    setValidation(result);
    if (result.validQuestions.length === 0) return;

    importQuestionsForSubject(importSubjectId, result.validQuestions, {
      replaceExistingCustom,
      hidePlaceholders,
    });

    const subjectName =
      state.subjects.find((s) => s.id === importSubjectId)?.name ?? importSubjectId;
    setImportSuccessMessage(
      `Imported ${result.validQuestions.length} question${result.validQuestions.length === 1 ? '' : 's'} into ${subjectName}${
        result.flaggedCount > 0
          ? ` (${result.flaggedCount} flagged for manual verification)`
          : ''
      }.`
    );
    setRawJson('');
    setValidation(null);
  };

  const handleDownloadTemplate = () => {
    const template = createQuestionImportTemplate(importSubjectId);
    const blob = new Blob([template], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${importSubjectId}-template.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetTargetSubject = state.subjects.find((s) => s.id === resetTargetSubjectId);
  const deleteTargetSubject = state.subjects.find((s) => s.id === deleteTargetSubjectId);

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure subjects, import structured question banks from your university PDFs, and manage your local study progress.
        </p>
      </div>

      {/* 1. Subjects Management */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Subjects</h2>
            <p className="text-xs text-slate-500">
              Rename placeholder subjects or add new subjects as your semester expands.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowAddForm((prev) => !prev)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Subject
          </Button>
        </div>

        {showAddForm && (
          <Card padding="md" className="border-slate-300 bg-slate-50/50">
            <form onSubmit={handleAddSubject} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g., Data Structures & Algorithms"
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Course Code
                  </label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder={`SUBJ-0${state.subjects.length + 1}`}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Optional course note or exam scope"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Create Subject
                </Button>
              </div>
            </form>
          </Card>
        )}

        <Card padding="none" className="divide-y divide-slate-100">
          {state.subjects.map((subject) => {
            const stats = getSubjectStats(subject.id);
            const isEditing = editingSubjectId === subject.id;
            const customCount = state.customQuestions[subject.id]?.length ?? 0;

            return (
              <div key={subject.id} className="p-4 sm:px-5">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Subject Name
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 focus:border-slate-900 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Code
                        </label>
                        <input
                          type="text"
                          value={editCode}
                          onChange={(e) => setEditCode(e.target.value)}
                          className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingSubjectId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSaveSubject(subject.id)}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {subject.name}
                        </span>
                        <Badge tone="neutral">{subject.code}</Badge>
                        <span className="text-xs text-slate-400 tabular-nums">
                          {stats.totalQuestions} question{stats.totalQuestions === 1 ? '' : 's'}
                        </span>
                        {customCount > 0 && (
                          <Badge tone="info">{customCount} imported</Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{subject.description}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => startEditingSubject(subject.id)}
                      >
                        Edit
                      </Button>
                      {customCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => clearCustomQuestionsForSubject(subject.id)}
                          title="Remove imported custom questions"
                        >
                          Clear Imports
                        </Button>
                      )}
                      {state.subjects.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTargetSubjectId(subject.id)}
                          aria-label={`Delete ${subject.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-rose-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      </section>

      {/* 2. Question Bank Import */}
      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Question Bank Import (PDF-Ready JSON)
            </h2>
            <p className="text-xs text-slate-500">
              Import structured questions extracted from your university PDFs without editing code. Unclear answer keys are automatically flagged for verification instead of guessed.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleDownloadTemplate}>
            <Download className="h-3.5 w-3.5" />
            Download Template
          </Button>
        </div>

        <Card padding="lg" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="import-subject-select"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Target Subject
              </label>
              <select
                id="import-subject-select"
                value={importSubjectId}
                onChange={(e) => {
                  setImportSubjectId(e.target.value);
                  setValidation(null);
                  setImportSuccessMessage(null);
                }}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
              >
                {state.subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Load JSON File
              </label>
              <label className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-100/70 transition-colors">
                <Upload className="h-3.5 w-3.5 text-slate-500" />
                Choose .json Question File
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label
              htmlFor="json-paste-input"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Or Paste JSON Question Array
            </label>
            <textarea
              id="json-paste-input"
              rows={5}
              value={rawJson}
              onChange={(e) => {
                setRawJson(e.target.value);
                setValidation(null);
                setImportSuccessMessage(null);
              }}
              placeholder='[{"id": "subject-01-q001", "text": "...", "options": {"A": "...", "B": "...", "C": "...", "D": "..."}, "correctAnswer": "A"}]'
              className="w-full rounded-lg border border-slate-200 bg-slate-50/40 p-3 font-mono text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hidePlaceholders}
                onChange={(e) => setHidePlaceholders(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              Hide placeholder questions for this subject after import
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={replaceExistingCustom}
                onChange={(e) => setReplaceExistingCustom(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              Replace previous imports for this subject
            </label>
          </div>

          {validation && (
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 space-y-2 text-xs">
              <div className="flex flex-wrap items-center gap-2 font-medium text-slate-800">
                <FileJson className="h-4 w-4 text-slate-500" />
                <span>
                  Validation Preview: {validation.validQuestions.length} ready to import
                </span>
                {validation.flaggedCount > 0 && (
                  <Badge tone="warning">
                    <AlertTriangle className="h-3 w-3" />
                    {validation.flaggedCount} flagged for verification
                  </Badge>
                )}
              </div>

              {validation.errors.length > 0 && (
                <ul className="list-disc pl-5 text-rose-700 space-y-0.5">
                  {validation.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}

              {validation.warnings.length > 0 && (
                <ul className="list-disc pl-5 text-amber-800 space-y-0.5">
                  {validation.warnings.slice(0, 5).map((warn, i) => (
                    <li key={i}>{warn}</li>
                  ))}
                  {validation.warnings.length > 5 && (
                    <li>and {validation.warnings.length - 5} more warning(s)...</li>
                  )}
                </ul>
              )}
            </div>
          )}

          {importSuccessMessage && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800">
              {importSuccessMessage}
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={!rawJson.trim()}
              onClick={handleValidateJson}
            >
              Validate JSON
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!rawJson.trim()}
              onClick={handleConfirmImport}
            >
              Import Questions
            </Button>
          </div>
        </Card>
      </section>

      {/* 3. Study Preferences */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Study Preferences</h2>
          <p className="text-xs text-slate-500">
            Saved automatically to LocalStorage across sessions.
          </p>
        </div>

        <Card padding="lg" className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="student-name-input"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Display Name (Optional)
              </label>
              <input
                id="student-name-input"
                type="text"
                value={state.preferences.studentName}
                onChange={(e) => updatePreferences({ studentName: e.target.value })}
                placeholder="Your name"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="default-mode-select"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Preferred Default Mode
              </label>
              <select
                id="default-mode-select"
                value={state.preferences.defaultMode}
                onChange={(e) =>
                  updatePreferences({ defaultMode: e.target.value as PracticeMode })
                }
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
              >
                <option value="practice">Practice Mode (Immediate Feedback)</option>
                <option value="exam">Exam Mode (Score on Submit)</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-slate-100 border-t border-slate-100">
            <label className="flex items-center justify-between gap-4 py-3 cursor-pointer">
              <div>
                <span className="block text-sm font-medium text-slate-800">
                  Show session timer
                </span>
                <span className="block text-xs text-slate-500">
                  Display elapsed study time in the quiz header.
                </span>
              </div>
              <input
                type="checkbox"
                checked={state.preferences.showTimer}
                onChange={(e) => updatePreferences({ showTimer: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
            </label>

            <label className="flex items-center justify-between gap-4 py-3 cursor-pointer">
              <div>
                <span className="block text-sm font-medium text-slate-800">
                  Confirm before submitting exam
                </span>
                <span className="block text-xs text-slate-500">
                  Ask for confirmation if there are unanswered questions in Exam Mode.
                </span>
              </div>
              <input
                type="checkbox"
                checked={state.preferences.confirmBeforeExamSubmit}
                onChange={(e) =>
                  updatePreferences({ confirmBeforeExamSubmit: e.target.checked })
                }
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
            </label>

            <label className="flex items-center justify-between gap-4 py-3 pb-0 cursor-pointer">
              <div>
                <span className="block text-sm font-medium text-slate-800">
                  Keyboard shortcuts
                </span>
                <span className="block text-xs text-slate-500">
                  Use A–D or 1–4 to pick options, and Left / Right arrows to move between questions.
                </span>
              </div>
              <input
                type="checkbox"
                checked={state.preferences.enableKeyboardShortcuts}
                onChange={(e) =>
                  updatePreferences({ enableKeyboardShortcuts: e.target.checked })
                }
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
            </label>
          </div>
        </Card>
      </section>

      {/* 4. Reset Progress */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Reset Practice Progress</h2>
          <p className="text-xs text-slate-500">
            Clear saved answers and session history while keeping your subjects and imported questions intact.
          </p>
        </div>

        <Card padding="lg" className="space-y-4 border-rose-200/70">
          <div className="space-y-2">
            <span className="block text-xs font-medium text-slate-700">
              Reset Individual Subject Progress
            </span>
            <div className="flex flex-wrap gap-2">
              {state.subjects.map((subject) => (
                <Button
                  key={subject.id}
                  variant="secondary"
                  size="sm"
                  onClick={() => setResetTargetSubjectId(subject.id)}
                >
                  <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                  Reset {subject.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="block text-sm font-medium text-slate-900">
                Reset All Practice &amp; Exam Progress
              </span>
              <span className="block text-xs text-slate-500">
                Permanently clears completed questions, active sessions, and all session history.
              </span>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirmResetAll(true)}
              className="self-start sm:self-center shrink-0"
            >
              Reset All Progress
            </Button>
          </div>
        </Card>
      </section>

      {/* Modals */}
      <ConfirmModal
        open={confirmResetAll}
        title="Reset all practice progress?"
        description="This will erase all completed question records, paused sessions, and exam history across every subject. Your subject names and imported questions will not be deleted."
        confirmLabel="Yes, Reset Everything"
        confirmVariant="danger"
        onCancel={() => setConfirmResetAll(false)}
        onConfirm={() => {
          resetAllProgress();
          setConfirmResetAll(false);
        }}
      />

      <ConfirmModal
        open={Boolean(resetTargetSubject)}
        title={`Reset progress for ${resetTargetSubject?.name ?? ''}?`}
        description="This clears completed answers, active sessions, and history for this subject only. Your question bank remains untouched."
        confirmLabel="Reset Subject Progress"
        confirmVariant="danger"
        onCancel={() => setResetTargetSubjectId(null)}
        onConfirm={() => {
          if (resetTargetSubjectId) {
            resetSubjectProgress(resetTargetSubjectId);
          }
          setResetTargetSubjectId(null);
        }}
      />

      <ConfirmModal
        open={Boolean(deleteTargetSubject)}
        title={`Delete ${deleteTargetSubject?.name ?? ''}?`}
        description="This removes the subject, its imported questions, and its associated progress history. This action cannot be undone."
        confirmLabel="Delete Subject"
        confirmVariant="danger"
        onCancel={() => setDeleteTargetSubjectId(null)}
        onConfirm={() => {
          if (deleteTargetSubjectId) {
            deleteSubject(deleteTargetSubjectId);
          }
          setDeleteTargetSubjectId(null);
        }}
      />
    </div>
  );
};
