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

import { CHAMPIONS, guideSectionsFor } from '../core/champions';

describe('チャンピオン辞書と教科書の対応', () => {
  it('教科書のチャンピオン別ガイド見出しはすべて辞書のチャンピオンに紐づく', () => {
    const guideTitles = sections.filter((s) => /^\d+\.\s*\S+.*(\([A-Za-z].*\)|完全攻略)/.test(s.title));
    expect(guideTitles.length).toBeGreaterThan(25);
    const linked = new Set(CHAMPIONS.flatMap((c) => guideSectionsFor(c.name, sections).map((s) => s.id)));
    const missing = guideTitles.filter((s) => !linked.has(s.id)).map((s) => s.title);
    expect(missing).toEqual([]);
  });
});

import { CHECKLIST } from '../core/checklist';

describe('チェックリストの参照章', () => {
  it.each(CHECKLIST.map((c) => [c.id, c.ref]))('%s -> %s が実在する', (_id, ref) => {
    expect(getSection(ref)).toBeDefined();
  });
});

import { allQuestions, routes, routeScenarios } from './index';

describe('ジャングルルート練習データ', () => {
  it('ルートIDが一意で参照章が実在し、キャンプがある', () => {
    expect(new Set(routes.map((r) => r.id)).size).toBe(routes.length);
    for (const r of routes) {
      expect(getSection(r.ref), r.id).toBeDefined();
      expect(r.camps.length, r.id).toBeGreaterThan(0);
    }
  });
  it('シナリオは形式が正しく、ルートIDが実在する', () => {
    for (const q of routeScenarios) {
      expect(q.subject).toBe('jungle');
      expect(q.choices).toHaveLength(4);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(4);
      expect(getSection(q.ref), q.id).toBeDefined();
      if (q.routeId) expect(routes.some((r) => r.id === q.routeId), q.id).toBe(true);
    }
  });
  it('全問題でIDが重複しない', () => {
    expect(new Set(allQuestions.map((q) => q.id)).size).toBe(allQuestions.length);
  });
});
