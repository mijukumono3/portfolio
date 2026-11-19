import { quiz, sections, workbookAnswers, workbookQuestions, getSection } from './index';
import { SUBJECTS } from '../core/progress';

describe('教科書データ', () => {
  it('章IDが一意', () => {
    expect(new Set(sections.map((s) => s.id)).size).toBe(sections.length);
  });
});

describe('クイズデータ', () => {
  it('IDが一意', () => {
    expect(new Set(quiz.map((q) => q.id)).size).toBe(quiz.length);
  });
  it.each(quiz.map((q) => [q.id, q] as const))('%s は形式が正しい', (_id, q) => {
    expect(SUBJECTS).toContain(q.subject);
    expect(q.choices).toHaveLength(4);
    expect(q.answer).toBeGreaterThanOrEqual(0);
    expect(q.answer).toBeLessThan(4);
    expect(q.question.length).toBeGreaterThan(0);
    expect(q.explanation.length).toBeGreaterThan(0);
    expect(getSection(q.ref)).toBeDefined();
  });
  it('7科目すべてに問題がある', () => {
    for (const s of SUBJECTS) expect(quiz.some((q) => q.subject === s)).toBe(true);
  });
});

describe('ワークブック模範解答', () => {
  it('全設問に模範解答があり、参照章が実在する', () => {
    for (const q of workbookQuestions) {
      const a = workbookAnswers[q.id];
      expect(a, q.id).toBeDefined();
      expect(a.answer.length).toBeGreaterThan(0);
      for (const ref of a.refs) expect(getSection(ref), `${q.id} -> ${ref}`).toBeDefined();
    }
  });
});
