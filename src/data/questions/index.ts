import type { Question } from '../../types/exam';
import subject01Questions from './subject-01.json';
import subject02Questions from './subject-02.json';

/**
 * Registry of built-in static question banks keyed by subject ID.
 *
 * To add a new subject statically:
 * 1. Add a JSON file in `src/data/questions/<subject-id>.json`
 * 2. Import and register it in `STATIC_QUESTION_BANKS` below.
 *
 * Alternatively, subjects and question banks can be added at runtime
 * via Settings -> Question Bank Import without modifying any UI code.
 */
export const STATIC_QUESTION_BANKS: Record<string, Question[]> = {
  'subject-01': subject01Questions as Question[],
  'subject-02': subject02Questions as Question[],
};
