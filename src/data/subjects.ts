import type { Subject } from '../types/exam';

/**
 * Default university subjects loaded on first run.
 * Users can rename these or add new subjects in Settings without modifying code.
 */
export const DEFAULT_SUBJECTS: Subject[] = [
  {
    id: 'subject-01',
    name: 'Struktur Data',
    code: 'STSI4104',
    description: 'Kisi-kisi soal UT STSI4104 — Struktur Data (array, linked list, stack, queue, sorting, tree, graph, DFS & BFS).',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'subject-02',
    name: 'Basis Data',
    code: 'STSI4105',
    description: 'Kisi-kisi soal UT STSI4105 — Basis Data (DBMS, model ER, yEd, normalisasi, SQL DDL/DML, transaksi, & replikasi).',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];
