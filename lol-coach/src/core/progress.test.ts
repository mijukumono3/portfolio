import { computeSubjectScores, recommendSubject, buildReviewQueue, type AnswerRecord } from './progress';
import { searchSections } from './search';

const questions = [
  { id: 'q1', subject: 'top' as const },
  { id: 'q2', subject: 'top' as const },
  { id: 'q3', subject: 'mid' as const },
  { id: 'q4', subject: 'macro' as const },
];
const rec = (questionId: string, correct: boolean, at: number): AnswerRecord => ({ questionId, correct, at });

describe('computeSubjectScores', () => {
  it('問題ごとの最新回答で科目別の正答率(0-100)を出す', () => {
    const s = computeSubjectScores(questions, [rec('q1', false, 1), rec('q1', true, 2), rec('q2', false, 3), rec('q3', true, 4)]);
    expect(s.top).toEqual({ score: 50, answered: 2, total: 2 });
    expect(s.mid).toEqual({ score: 100, answered: 1, total: 1 });
  });
  it('未回答の科目はscore null', () => {
    const s = computeSubjectScores(questions, []);
    expect(s.macro).toEqual({ score: null, answered: 0, total: 1 });
    expect(s.teamfight).toEqual({ score: null, answered: 0, total: 0 });
  });
});

describe('recommendSubject', () => {
  it('問題があり未回答の科目を最優先で推奨する', () => {
    const s = computeSubjectScores(questions, [rec('q1', true, 1), rec('q3', false, 2)]);
    expect(recommendSubject(s)).toBe('macro');
  });
  it('全科目回答済みなら最低点の科目', () => {
    const s = computeSubjectScores(questions, [rec('q1', true, 1), rec('q2', true, 1), rec('q3', false, 2), rec('q4', true, 3)]);
    expect(recommendSubject(s)).toBe('mid');
  });
  it('問題が1つもない場合はnull', () => {
    expect(recommendSubject(computeSubjectScores([], []))).toBeNull();
  });
});

describe('buildReviewQueue', () => {
  it('最新回答が誤答の問題 → 未回答 → 正解済み の順に並べる', () => {
    const q = buildReviewQueue(['q1', 'q2', 'q3', 'q4'], [rec('q1', true, 1), rec('q2', false, 2), rec('q4', false, 3), rec('q4', true, 4)]);
    expect(q).toEqual(['q2', 'q3', 'q1', 'q4']);
  });
});

describe('searchSections', () => {
  const sections = [
    { id: 's1', title: 'ガンクの基本', level: 1, body: 'ボットにガンク。ボットが大事。' },
    { id: 's2', title: '視界', level: 1, body: 'ワードを置く。BOTの視界。' },
    { id: 's3', title: 'その他', level: 1, body: '関係なし' },
  ];
  it('空クエリは結果なし', () => {
    expect(searchSections(sections, '  ')).toEqual([]);
  });
  it('ヒット件数の多い順、大文字小文字を区別しない', () => {
    const r = searchSections(sections, 'ボット');
    expect(r.map((x) => x.id)).toEqual(['s1']);
    expect(r[0].count).toBe(2);
    expect(searchSections(sections, 'bot')[0].id).toBe('s2');
  });
  it('タイトル一致も含め、前後の抜粋を返す', () => {
    const r = searchSections(sections, '視界');
    expect(r[0].id).toBe('s2');
    expect(r[0].snippet).toContain('視界');
  });
});
