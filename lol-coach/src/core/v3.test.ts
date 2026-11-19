import { checklistStats, CHECKLIST } from './checklist';
import { mapDocxImages, parseRels } from './docxImages';

describe('振り返りチェックリスト checklistStats', () => {
  const ids = CHECKLIST.map((c) => c.id);
  it('7項目ある', () => {
    expect(CHECKLIST).toHaveLength(7);
    expect(new Set(ids).size).toBe(7);
  });
  it('項目ごとの達成率と勝敗別の達成率を出す', () => {
    const sessions = [
      { date: 'd1', results: ['W', 'L'] as ('W' | 'L')[], notes: [], checks: [[ids[0], ids[1]], [ids[1]]] },
      { date: 'd2', results: ['W'] as ('W' | 'L')[], notes: [], checks: [[ids[0]]] },
    ];
    const s = checklistStats(sessions);
    expect(s.games).toBe(3);
    const first = s.items.find((i) => i.id === ids[0])!;
    expect(first.rate).toBe(67);
    expect(first.winRate).toBe(100);
    expect(first.lossRate).toBe(0);
    expect(first.gap).toBe(100);
  });
  it('チェックを付けていない試合は集計しない', () => {
    const s = checklistStats([{ date: 'd', results: ['W', 'L'], notes: [], checks: [[ids[0]]] }]);
    expect(s.games).toBe(1);
  });
  it('勝敗差が大きい順＝勝敗を分けている習慣を先頭にする', () => {
    const sessions = [
      { date: 'd1', results: ['W', 'L'] as ('W' | 'L')[], notes: [], checks: [[ids[2], ids[3]], [ids[3]]] },
    ];
    expect(checklistStats(sessions).keyHabits[0].id).toBe(ids[2]);
  });
});

describe('docx 図版の章割り当て', () => {
  const rels = `<Relationships><Relationship Id="rId5" Type="http://x/image" Target="media/image1.png"/><Relationship Id="rId6" Type="http://x/image" Target="media/image2.jpeg"/><Relationship Id="rId9" Type="http://x/hyperlink" Target="https://x.com" TargetMode="External"/></Relationships>`;
  const p = (text: string, img?: string) =>
    `<w:p><w:r><w:t xml:space="preserve">${text}</w:t></w:r>${img ? `<w:r><w:drawing><a:blip r:embed="${img}"/></w:drawing></w:r>` : ''}</w:p>`;
  const sections = [
    { id: 's001', title: 'LOLの教科書' },
    { id: 's002', title: '大前提' },
    { id: 's003', title: '(1) トップ：タンク、遠距離ディーラー、ブルーザー' },
  ];
  it('rels から画像のIDとパスを取る（画像以外は無視）', () => {
    expect(parseRels(rels)).toEqual({ rId5: 'word/media/image1.png', rId6: 'word/media/image2.jpeg' });
  });
  it('見出し段落のあとに出てくる画像をその章に割り当てる', () => {
    const doc = `<w:body>${p('LOLの教科書')}${p('本文', 'rId5')}${p('大前提')}${p('ボット &gt; ミッド')}${p('**(1) トップ：タンク、遠距離ディーラー、ブルーザー**')}${p('', 'rId6')}</w:body>`;
    expect(mapDocxImages(doc, rels, sections)).toEqual({ s001: ['word/media/image1.png'], s003: ['word/media/image2.jpeg'] });
  });
  it('本文中に章名と同じ語があっても長い段落では章を切り替えない', () => {
    const doc = `<w:body>${p('LOLの教科書')}${p('この段落は大前提について長く説明している本文で、見出しではありません。とても長い文章が続きます。さらに続きます。')}${p('', 'rId5')}</w:body>`;
    expect(mapDocxImages(doc, rels, sections)).toEqual({ s001: ['word/media/image1.png'] });
  });
});
