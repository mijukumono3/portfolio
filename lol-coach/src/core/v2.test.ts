import { parseBackup, serializeBackup } from './backup';
import { buildDailyPlan } from './daily';
import { normalizeName, searchChampions, guideSectionsFor, CHAMPIONS } from './champions';
import type { AnswerRecord } from './progress';

describe('バックアップ', () => {
  const data = {
    version: 1 as const,
    answers: [{ questionId: 'q1', correct: true, at: 1 }],
    workbook: {},
    bookmarks: ['s001'],
    read: [],
    sessions: [{ date: '2026-11-19', results: ['W' as const], notes: [''] }],
    insights: [],
    replays: [],
  };
  it('書き出した内容をそのまま読み戻せる', () => {
    const r = parseBackup(serializeBackup(data, new Date('2026-11-19T00:00:00Z')));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual(data);
  });
  it('書き出しにはアプリ名と日時が入る', () => {
    const json = JSON.parse(serializeBackup(data, new Date('2026-11-19T00:00:00Z')));
    expect(json.app).toBe('lol-coach');
    expect(json.exportedAt).toBe('2026-11-19T00:00:00.000Z');
  });
  it('JSONでなければエラー', () => {
    expect(parseBackup('not json')).toMatchObject({ ok: false });
  });
  it('別アプリのファイルはエラー', () => {
    expect(parseBackup(JSON.stringify({ app: 'other', data }))).toMatchObject({ ok: false });
  });
  it('配列のはずの項目が壊れていればエラー', () => {
    expect(parseBackup(JSON.stringify({ app: 'lol-coach', data: { ...data, answers: 'x' } }))).toMatchObject({ ok: false });
  });
  it('勝敗にW/L以外が入っていればエラー', () => {
    const bad = { ...data, sessions: [{ date: '2026-11-19', results: ['X'], notes: [] }] };
    expect(parseBackup(JSON.stringify({ app: 'lol-coach', data: bad }))).toMatchObject({ ok: false });
  });
  it('振り返りチェックとリプレイノートも往復できる', () => {
    const withV3 = {
      ...data,
      sessions: [{ date: '2026-11-19', results: ['W' as const], notes: [''], checks: [['vision-first']] }],
      replays: [{ id: 'r1', date: '2026-11-19', player: 'Faker', champion: 'アーリ', role: 'mid', time: '03:30', situation: 'a', action: 'b', why: 'c', insight: 'd' }],
    };
    const r = parseBackup(serializeBackup(withV3));
    expect(r.ok && r.data).toEqual(withV3);
  });
  it('欠けた項目は空で補う（古いバックアップ互換）', () => {
    const r = parseBackup(JSON.stringify({ app: 'lol-coach', data: { version: 1, answers: [] } }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.sessions).toEqual([]);
  });
});

describe('今日の課題 buildDailyPlan', () => {
  const quiz = [
    { id: 'a1', subject: 'top' as const, ref: 's1' },
    { id: 'a2', subject: 'top' as const, ref: 's2' },
    { id: 'b1', subject: 'mid' as const, ref: 's3' },
    { id: 'b2', subject: 'mid' as const, ref: 's3' },
    { id: 'b3', subject: 'mid' as const, ref: 's4' },
    { id: 'b4', subject: 'mid' as const, ref: 's5' },
  ];
  const rec = (questionId: string, correct: boolean, at = 1): AnswerRecord => ({ questionId, correct, at });

  it('推奨科目から3問、誤答→未回答の順で選ぶ', () => {
    const answers = [rec('a1', true), rec('a2', true), rec('b3', false)];
    const p = buildDailyPlan('2026-11-19', quiz, answers, [])!;
    expect(p.subject).toBe('mid');
    expect(p.questionIds).toEqual(['b3', 'b1', 'b2']);
  });
  it('関連章は課題の問題が参照する未読の章', () => {
    const p = buildDailyPlan('2026-11-19', quiz, [rec('a1', true), rec('a2', true), rec('b3', false)], ['s4'])!;
    expect(p.sectionId).toBe('s3');
  });
  it('同じ日なら当日の回答で課題が変わらない（固定）', () => {
    const before = buildDailyPlan('2026-11-19', quiz, [rec('a1', true), rec('a2', true)], [])!;
    const dayStart = new Date(2026, 10, 19).getTime();
    const after = buildDailyPlan('2026-11-19', quiz, [rec('a1', true), rec('a2', true), rec('b1', true, dayStart + 1000)], [])!;
    expect(after.questionIds).toEqual(before.questionIds);
  });
  it('当日に正解した課題数を数える', () => {
    const dayStart = new Date(2026, 10, 19).getTime();
    const p = buildDailyPlan('2026-11-19', quiz, [rec('a1', true), rec('a2', true), rec('b1', true, dayStart + 1000)], [])!;
    expect(p.doneIds).toEqual(['b1']);
  });
  it('問題が無ければnull', () => {
    expect(buildDailyPlan('2026-11-19', [], [], [])).toBeNull();
  });
});

describe('チャンピオン検索', () => {
  it('かな/カナ・記号・空白・大小文字を無視して正規化する', () => {
    expect(normalizeName('カイ＝サ')).toBe(normalizeName('かいさ'));
    expect(normalizeName('リー・シン')).toBe(normalizeName('リーシン'));
    expect(normalizeName('Lee Sin')).toBe(normalizeName('leesin'));
  });
  it('部分一致で検索でき、前方一致を優先する', () => {
    const r = searchChampions('ダ');
    expect(r[0].name).toBe('ダリウス');
    expect(r.map((c) => c.name)).toContain('ダイアナ');
  });
  it('英語名でも検索できる', () => {
    expect(searchChampions('graves')[0].name).toBe('グレイブス');
  });
  it('教科書の分類を持つ', () => {
    const leona = CHAMPIONS.find((c) => c.name === 'レオナ')!;
    expect(leona.support).toBe('cc');
    const talon = CHAMPIONS.find((c) => c.name === 'タロン')!;
    expect(talon.mid).toBe('roam1');
    expect(CHAMPIONS.find((c) => c.name === 'マルファイト')!.top).toBe('tank');
  });
  it('名前が重複しない', () => {
    expect(new Set(CHAMPIONS.map((c) => c.name)).size).toBe(CHAMPIONS.length);
  });
  it('ガイド章を見出しから引ける', () => {
    const sections = [
      { id: 's058', title: '1. ゼド (Zed)', level: 3, body: '' },
      { id: 's128', title: '1. アカリ完全攻略ガイド', level: 1, body: '' },
      { id: 's146', title: '3. ダイアナ完全攻略ガイドブック', level: 1, body: '' },
      { id: 's068', title: '11. ダイアナ (Diana)', level: 3, body: '' },
    ];
    expect(guideSectionsFor('ダイアナ', sections).map((s) => s.id)).toEqual(['s146', 's068']);
    expect(guideSectionsFor('ゼド', sections).map((s) => s.id)).toEqual(['s058']);
  });
});
