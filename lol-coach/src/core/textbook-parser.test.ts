// @ts-expect-error -- plain ESM script without type declarations
import { cleanLine, parseHeading, parseSections, parseWorkbook } from '../../scripts/textbook-parser.mjs';

describe('cleanLine', () => {
  it('Markdownエスケープと強調記号を除去する', () => {
    expect(cleanLine('\\*\\*重要 O\\*\\* (Q1\\~Q9)')).toBe('重要 O (Q1~Q9)');
    expect(cleanLine('**タンク VS タンク : 重要 X**')).toBe('タンク VS タンク : 重要 X');
  });
  it('空の画像リンクとHTMLコメントを除去する', () => {
    expect(cleanLine('[](https://x.com/a)本文<!-- end list -->')).toBe('本文');
  });
});

describe('parseHeading', () => {
  it('短い # 行を見出しとして扱う', () => {
    expect(parseHeading('## **大前提** ')).toEqual({ level: 2, title: '大前提' });
    expect(parseHeading('1.  ## **大前提**')).toEqual({ level: 2, title: '大前提' });
  });
  it('# で始まる長い本文は見出しにしない', () => {
    expect(parseHeading('# ' + 'あ'.repeat(70))).toBeNull();
    expect(parseHeading('# なので、これは相手ジャングラーが、')).toBeNull();
    expect(parseHeading('# なので、これは相手ジャングラーが  ')).toBeNull();
    expect(parseHeading('# 単純にレッド → 敵ブルーを狩った後、 相手の構成が   ')).toBeNull();
  });
  it('本来の「放」は残す', () => {
    expect(parseHeading('# \\-----**5. 迷いからの解放**-----')?.title).toBe('5. 迷いからの解放');
  });
  it('見出し内の区切り線と装飾の名残を除去する', () => {
    expect(parseHeading('# \\-----**ルール2. 試合と試合の間には「筋トレ」****放**-----')).toEqual({
      level: 1,
      title: 'ルール2. 試合と試合の間には「筋トレ」',
    });
    expect(parseHeading('# \\-----**2. 現実の壁：勝率50%**-----**\\[これが私の実力なのか？\\]**')?.title).toBe(
      '2. 現実の壁：勝率50% [これが私の実力なのか？]',
    );
  });
});

describe('parseSections', () => {
  it('見出しごとに章を分割しIDを振る', () => {
    const s = parseSections('# 第一章\n本文A\n## 小見出し\n本文B');
    expect(s.map((x: { title: string }) => x.title)).toEqual(['第一章', '小見出し']);
    expect(s[0].id).toBe('s001');
    expect(s[1].body).toBe('本文B');
  });
});

describe('parseWorkbook', () => {
  it('ワークブック内のQ設問を回答欄まで抽出する', () => {
    const text = [
      '# **【実戦】ワークブック(p.3\\~6)**',
      '## **Part 1. 基礎 (Q1\\~Q9)**',
      'Q1. 【複合シナリオ】',
      '最初のガンクはどこ？',
      '\\[ \\] 回答記入:',
      'Q2. 【時間帯】',
      '理由は？',
      '\\[ \\] 回答記入:',
    ].join('\n');
    const qs = parseWorkbook(text);
    expect(qs).toHaveLength(2);
    expect(qs[0]).toMatchObject({ id: 'wb01', title: 'Q1. 【複合シナリオ】', body: '最初のガンクはどこ？' });
    expect(qs[0].part).toBe('Part 1. 基礎 (Q1~Q9)');
  });
  it('番号付き形式の設問はブックごとに1から番号を振る', () => {
    const text = [
      '# **【A】ワークブック**',
      'Q1. 【x】',
      'a',
      '回答記入',
      '# **【LoLの教科書】**',
      'チャレンジャー思考ドリル：全80問*',
      '1.  **(p.3 vs p.7)** 問1',
      '    \\[ \\] 回答記入:',
      '1.  **(p.5 vs p.11)** 問2',
      '    \\[ \\] 回答記入:',
    ].join('\n');
    const qs = parseWorkbook(text);
    expect(qs.map((q: { title: string }) => q.title)).toEqual(['Q1. 【x】', 'Q1. (p.3 vs p.7)', 'Q2. (p.5 vs p.11)']);
    expect(qs[2].body).toBe('問2');
    expect(qs[1].book).toBe('チャレンジャー思考ドリル');
  });
});
