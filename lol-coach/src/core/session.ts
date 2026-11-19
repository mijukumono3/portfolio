// 教科書「ルール1. 3戦セットの飴と鞭」の判定ロジック
// - 基本セットは3戦固定
// - 2連敗したらその日のランク戦は強制終了
// - 3戦の結果が2勝1敗 or 3勝0敗なら、負けるまで続行（負けたら即終了）

export type GameResult = 'W' | 'L';

export interface SessionEvaluation {
  status: 'continue' | 'stop';
  /** base: 基本の3戦セット中 / extension: 2勝以上で延長中 */
  phase: 'base' | 'extension';
  reason: string;
  wins: number;
  losses: number;
  games: number;
}

export const BASE_SET = 3;

export function evaluateSession(results: GameResult[]): SessionEvaluation {
  const wins = results.filter((r) => r === 'W').length;
  const losses = results.length - wins;
  const games = results.length;
  const base = { wins, losses, games };

  for (let i = 1; i < results.length; i++) {
    if (results[i] === 'L' && results[i - 1] === 'L') {
      return { ...base, status: 'stop', phase: i < BASE_SET ? 'base' : 'extension', reason: '2連敗したので今日のランク戦は終了です。頭を冷やして明日に備えましょう。' };
    }
  }

  if (games < BASE_SET) {
    return { ...base, status: 'continue', phase: 'base', reason: `3戦セットの${games + 1}戦目へ。最高の集中力で臨みましょう。` };
  }

  const baseWins = results.slice(0, BASE_SET).filter((r) => r === 'W').length;
  if (baseWins < 2) {
    return { ...base, status: 'stop', phase: 'base', reason: `3戦${baseWins}勝で終了です。明日の3戦に飢餓感を持ち越しましょう。` };
  }

  if (games > BASE_SET && results[games - 1] === 'L') {
    return { ...base, status: 'stop', phase: 'extension', reason: '延長戦で負けたので即終了です。良いコンディションのまま終えましょう。' };
  }

  return { ...base, status: 'continue', phase: 'extension', reason: '2勝以上達成！負けるまで延長戦を続行できます。' };
}
