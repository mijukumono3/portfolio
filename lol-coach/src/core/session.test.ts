import { evaluateSession, type GameResult } from './session';

const ev = (s: string) => evaluateSession(s.split('').filter(Boolean) as GameResult[]);

describe('evaluateSession（3戦セット）', () => {
  it('開始前は続行', () => {
    expect(ev('').status).toBe('continue');
  });
  it('1敗では続行', () => {
    expect(ev('L').status).toBe('continue');
  });
  it('2連敗で終了', () => {
    const r = ev('LL');
    expect(r.status).toBe('stop');
    expect(r.reason).toContain('2連敗');
  });
  it('3戦目で2連敗なら終了', () => {
    expect(ev('WLL').status).toBe('stop');
  });
  it('3戦1勝2敗（連敗なし）は終了', () => {
    const r = ev('LWL');
    expect(r.status).toBe('stop');
    expect(r.reason).toContain('1勝');
  });
  it('2勝は3戦目へ続行', () => {
    expect(ev('WW').status).toBe('continue');
    expect(ev('WL').status).toBe('continue');
  });
  it('3戦2勝1敗以上は負けるまで続行', () => {
    expect(ev('WLW').status).toBe('continue');
    expect(ev('LWW').status).toBe('continue');
    expect(ev('WWW').status).toBe('continue');
    expect(ev('WLWW').status).toBe('continue');
    expect(ev('WWWWW').status).toBe('continue');
  });
  it('延長戦で負けたら即終了', () => {
    const r = ev('WLWL');
    expect(r.status).toBe('stop');
    expect(r.reason).toContain('延長');
  });
  it('集計値を返す', () => {
    expect(ev('WLWW')).toMatchObject({ wins: 3, losses: 1, games: 4, phase: 'extension' });
    expect(ev('WL')).toMatchObject({ phase: 'base' });
  });
});
