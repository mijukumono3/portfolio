import { evaluateBot, evaluateMid, evaluateTop, evaluateMatchup, type MatchupInput } from './matchup';

describe('トップ', () => {
  it('タンク vs タンク は重要X', () => {
    expect(evaluateTop('tank', 'tank', false).level).toBe(0);
  });
  it('タンク vs ブルーザー（どちら向きでも）は重要X', () => {
    expect(evaluateTop('tank', 'bruiser', true).level).toBe(0);
    expect(evaluateTop('bruiser', 'tank', true).level).toBe(0);
  });
  it('タンク/ブルーザー vs 遠距離ディーラー はLv6前X・Lv6以降O', () => {
    expect(evaluateTop('tank', 'ranged', false).level).toBe(0);
    expect(evaluateTop('bruiser', 'ranged', true).level).toBe(1);
  });
  it('ブルーザー vs ブルーザー は重要O', () => {
    expect(evaluateTop('bruiser', 'bruiser', false).level).toBe(1);
  });
  it('味方が遠距離ディーラーなら重要Oで初手ターン優先', () => {
    const r = evaluateTop('ranged', 'tank', false);
    expect(r.level).toBe(1);
    expect(r.firstTurn).toBe(true);
  });
});

describe('ミッド', () => {
  it('1ティアロームはLv不問で重要O', () => {
    expect(evaluateMid('roam1', 'rangedFarm', false).level).toBe(1);
  });
  it('2・3ティアロームはLv6以降のみ重要O', () => {
    expect(evaluateMid('roam2', 'rangedFarm', false).level).toBe(0);
    expect(evaluateMid('roam2', 'rangedFarm', true).level).toBe(1);
    expect(evaluateMid('roam3', 'rangedFarm', true).level).toBe(1);
  });
  it('遠距離ファームは重要Xで視界確保を助言', () => {
    const r = evaluateMid('rangedFarm', 'roam1', true);
    expect(r.level).toBe(0);
    expect(r.reasons.join()).toContain('視界');
  });
  it('レーン戦が強いチャンピオンは重要O', () => {
    expect(evaluateMid('laneBully', 'rangedFarm', false).level).toBe(1);
  });
  it('近接1v1は重要O、近接vs近接は最重要', () => {
    expect(evaluateMid('meleeDuel', 'rangedFarm', false).level).toBe(1);
    expect(evaluateMid('meleeDuel', 'meleeDuel', false).level).toBe(2);
  });
});

describe('ボット（サポート70%:ADC30%）', () => {
  it('レーン戦が強いADC + CCサポートは最重要', () => {
    expect(evaluateBot('bully', 'cc').level).toBe(2);
  });
  it('レーン戦が強いADC + 牽制サポート / ロームサポートは最重要', () => {
    expect(evaluateBot('bully', 'poke').level).toBe(2);
    expect(evaluateBot('bully', 'roam').level).toBe(2);
  });
  it('レーン戦が強いADC + ユーティリティサポートは重要O（間接ガンク）', () => {
    expect(evaluateBot('bully', 'utility').level).toBe(1);
  });
  it('五分五分ADC + ユーティリティサポートは重要X', () => {
    expect(evaluateBot('even', 'utility').level).toBe(0);
  });
  it('五分五分ADC + CCサポートは重要O', () => {
    const r = evaluateBot('even', 'cc');
    expect(r.level).toBe(1);
    expect(r.score).toBeCloseTo(0.7);
  });
});

describe('evaluateMatchup（総合）', () => {
  const base: MatchupInput = {
    level6: false,
    top: { ally: 'tank', enemy: 'tank' },
    mid: { ally: 'rangedFarm', enemy: 'rangedFarm' },
    bot: { adc: 'bully', support: 'cc' },
  };
  it('ワークブックQ1: ボット最重要・ミッドX・トップXならボットが最優先', () => {
    const r = evaluateMatchup(base);
    expect(r.priority[0]).toBe('bot');
  });
  it('すべて同じ重要度なら ボット > ミッド > トップ', () => {
    const r = evaluateMatchup({ ...base, bot: { adc: 'even', support: 'utility' } });
    expect(r.priority).toEqual(['bot', 'mid', 'top']);
  });
  it('重要度が高いレーンが大前提より優先される', () => {
    const r = evaluateMatchup({
      ...base,
      mid: { ally: 'meleeDuel', enemy: 'meleeDuel' },
      bot: { adc: 'even', support: 'utility' },
    });
    expect(r.priority[0]).toBe('mid');
  });
  it('味方トップが遠距離ディーラーなら初手ターンはトップ', () => {
    const r = evaluateMatchup({ ...base, top: { ally: 'ranged', enemy: 'bruiser' } });
    expect(r.firstTurn).toBe('top');
    expect(r.priority[0]).toBe('bot');
  });
});
