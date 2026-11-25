import { OPTION_KEYS, type OptionKey, type Question } from '../types/exam';

export interface ImportValidationResult {
  validQuestions: Question[];
  flaggedCount: number;
  errors: string[];
  warnings: string[];
}

function isValidOptionKey(value: unknown): value is OptionKey {
  return typeof value === 'string' && OPTION_KEYS.includes(value.toUpperCase() as OptionKey);
}

/**
 * Validates and normalizes an imported JSON array of questions.
 *
 * Strict integrity policy:
 * - Never invents question text or option content.
 * - Never guesses a missing or ambiguous answer key.
 * - Flags unclear or incomplete answer keys with `needsVerification: true`.
 */
export function parseAndValidateQuestionImport(
  rawJson: string,
  targetSubjectId: string
): ImportValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validQuestions: Question[] = [];
  let flaggedCount = 0;

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return {
      validQuestions: [],
      flaggedCount: 0,
      errors: ['Invalid JSON syntax. Please verify the file is valid JSON.'],
      warnings: [],
    };
  }

  const items = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as { questions?: unknown }).questions)
      ? (parsed as { questions: unknown[] }).questions
      : null;

  if (!items) {
    return {
      validQuestions: [],
      flaggedCount: 0,
      errors: ['Expected a JSON array of questions or an object with a "questions" array.'],
      warnings: [],
    };
  }

  if (items.length === 0) {
    return {
      validQuestions: [],
      flaggedCount: 0,
      errors: ['The imported file contains zero questions.'],
      warnings: [],
    };
  }

  const seenIds = new Set<string>();

  items.forEach((rawItem, index) => {
    const label = `Item #${index + 1}`;
    if (!rawItem || typeof rawItem !== 'object') {
      errors.push(`${label}: Must be an object.`);
      return;
    }

    const record = rawItem as Record<string, unknown>;
    const text = typeof record.text === 'string' ? record.text.trim() : '';
    if (!text) {
      errors.push(`${label}: Missing required "text" field.`);
      return;
    }

    const rawOptions = record.options as Record<string, unknown> | undefined;
    if (!rawOptions || typeof rawOptions !== 'object') {
      errors.push(`${label}: Missing required "options" object (A, B, C, D).`);
      return;
    }

    const options = {
      A: typeof rawOptions.A === 'string' ? rawOptions.A.trim() : '',
      B: typeof rawOptions.B === 'string' ? rawOptions.B.trim() : '',
      C: typeof rawOptions.C === 'string' ? rawOptions.C.trim() : '',
      D: typeof rawOptions.D === 'string' ? rawOptions.D.trim() : '',
    };

    const missingOptions = OPTION_KEYS.filter((key) => !options[key]);
    if (missingOptions.length > 0) {
      errors.push(`${label}: Missing text for option(s) ${missingOptions.join(', ')}.`);
      return;
    }

    const rawId = typeof record.id === 'string' && record.id.trim() ? record.id.trim() : `${targetSubjectId}-imported-${index + 1}`;
    let id = rawId;
    if (seenIds.has(id)) {
      id = `${rawId}-${index + 1}`;
      warnings.push(`${label}: Duplicate ID "${rawId}" renamed to "${id}".`);
    }
    seenIds.add(id);

    let correctAnswer: OptionKey | null = null;
    let needsVerification = Boolean(record.needsVerification);
    let verificationNote =
      typeof record.verificationNote === 'string' && record.verificationNote.trim()
        ? record.verificationNote.trim()
        : undefined;

    if (record.correctAnswer === null || record.correctAnswer === undefined || record.correctAnswer === '') {
      correctAnswer = null;
      needsVerification = true;
      verificationNote =
        verificationNote ?? 'Answer key missing from source import — flagged for manual verification.';
      warnings.push(`${label} (${id}): Missing answer key; flagged for manual verification.`);
    } else if (isValidOptionKey(record.correctAnswer)) {
      correctAnswer = record.correctAnswer.toUpperCase() as OptionKey;
    } else {
      correctAnswer = null;
      needsVerification = true;
      verificationNote =
        verificationNote ??
        `Unclear answer key value ("${String(record.correctAnswer)}") — flagged for manual verification instead of guessing.`;
      warnings.push(
        `${label} (${id}): Unrecognized answer key "${String(record.correctAnswer)}"; flagged for manual verification.`
      );
    }

    if (needsVerification) {
      flaggedCount += 1;
    }

    const sourceRaw = record.source as Record<string, unknown> | undefined;
    const source =
      sourceRaw && typeof sourceRaw === 'object'
        ? {
            fileName: typeof sourceRaw.fileName === 'string' ? sourceRaw.fileName : undefined,
            page: typeof sourceRaw.page === 'number' ? sourceRaw.page : undefined,
            originalNumber:
              typeof sourceRaw.originalNumber === 'number' || typeof sourceRaw.originalNumber === 'string'
                ? sourceRaw.originalNumber
                : undefined,
          }
        : undefined;

    validQuestions.push({
      id,
      subjectId: targetSubjectId,
      text,
      imageUrl: typeof record.imageUrl === 'string' && record.imageUrl.trim() ? record.imageUrl.trim() : undefined,
      imageAlt: typeof record.imageAlt === 'string' && record.imageAlt.trim() ? record.imageAlt.trim() : undefined,
      options,
      correctAnswer,
      explanation:
        typeof record.explanation === 'string' && record.explanation.trim() ? record.explanation.trim() : undefined,
      source,
      needsVerification,
      verificationNote,
      isPlaceholder: Boolean(record.isPlaceholder),
    });
  });

  return {
    validQuestions,
    flaggedCount,
    errors,
    warnings,
  };
}

export function createQuestionImportTemplate(subjectId: string): string {
  const sample = [
    {
      id: `${subjectId}-q001`,
      subjectId,
      text: 'Paste exact question text from the PDF here',
      options: {
        A: 'Exact option A text',
        B: 'Exact option B text',
        C: 'Exact option C text',
        D: 'Exact option D text',
      },
      correctAnswer: 'A',
      explanation: 'Optional explanation from the answer key (omit if not provided)',
      source: {
        fileName: 'exam-source.pdf',
        page: 1,
        originalNumber: 1,
      },
      needsVerification: false,
    },
    {
      id: `${subjectId}-q002`,
      subjectId,
      text: 'Example of an unclear PDF question where the answer key needs manual verification',
      options: {
        A: 'Option A',
        B: 'Option B',
        C: 'Option C',
        D: 'Option D',
      },
      correctAnswer: null,
      needsVerification: true,
      verificationNote: 'Answer key blurred on page 2 — verify before exam.',
      source: {
        fileName: 'exam-source.pdf',
        page: 2,
        originalNumber: 2,
      },
    },
  ];
  return JSON.stringify(sample, null, 2);
}
