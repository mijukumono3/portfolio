// 試合後の振り返りチェックリスト（教科書の判断基準から）
import type { Subject } from './progress';
import type { GameResult } from './session';

export interface CheckItem {
  id: string;
  subject: Subject;
  text: string;
  hint: string;
  /** 関連する教科書の章 */
  ref: string;
}

export const CHECKLIST: CheckItem[] = [
  { id: 'gank-priority', subject: 'jungle', text: 'ガンク先を「重要度」で決めた', hint: '大前提はボット＞ミッド＞トップ。構図で重要O/Xを判断できたか', ref: 's013' },
  { id: 'first-route', subject: 'jungle', text: '初手ルートを構図から選んだ', hint: '狙うレーンと相手ジャングラーのスタートからルートを決めたか', ref: 's027' },
  { id: 'vision-first', subject: 'macro', text: 'オブジェクトの前に視界を先に取った', hint: '視界を先に取る → 守る → オブジェクトを取る', ref: 's041' },
  { id: 'cross', subject: 'macro', text: '視界を失った時、無理せず別の利益に切り替えた', hint: '取り返せない時はオブジェクトを早めに諦めてタワーを折りに行く', ref: 's041' },
  { id: 'behind', subject: 'macro', text: '劣勢の時、相手の狙い（ダイブ・カジャングル・オブジェクト）に備えた', hint: '主導権を持つ相手が狙う3つの行動を読んで耐えたか', ref: 's053' },
  { id: 'reset-timing', subject: 'jungle', text: 'フルクリア後に行くかリコールかを視界で決めた', hint: 'マップの主導権と視界を見て、ガンクかリコールかを判断したか', ref: 's027' },
  { id: 'mental', subject: 'macro', text: '最後までティルトせず集中できた', hint: '怒りは理性を曇らせ、脳死プレイにつながる', ref: 's009' },
];

export interface ReviewedSession {
  date?: string;
  notes?: string[];
  results: GameResult[];
  /** JSON 経由で未記入の試合が null になることがある */
  checks?: (string[] | null)[];
}

export interface ItemStat {
  id: string;
  text: string;
  /** 振り返った試合のうち達成した割合 (0-100) */
  rate: number;
  winRate: number | null;
  lossRate: number | null;
  /** 勝ち試合と負け試合での達成率の差。大きいほど勝敗を分けている習慣 */
  gap: number | null;
}

const pct = (n: number, d: number) => (d === 0 ? null : Math.round((n / d) * 100));

export function checklistStats(sessions: ReviewedSession[]) {
  const reviewed: { result: GameResult; checks: string[] }[] = [];
  for (const s of sessions) {
    s.results.forEach((result, i) => {
      const checks = s.checks?.[i];
      if (checks) reviewed.push({ result, checks });
    });
  }
  const wins = reviewed.filter((g) => g.result === 'W');
  const losses = reviewed.filter((g) => g.result === 'L');
  const items: ItemStat[] = CHECKLIST.map((c) => {
    const has = (g: { checks: string[] }) => g.checks.includes(c.id);
    const winRate = pct(wins.filter(has).length, wins.length);
    const lossRate = pct(losses.filter(has).length, losses.length);
    return {
      id: c.id,
      text: c.text,
      rate: pct(reviewed.filter(has).length, reviewed.length) ?? 0,
      winRate,
      lossRate,
      gap: winRate !== null && lossRate !== null ? winRate - lossRate : null,
    };
  });
  const keyHabits = items.filter((i) => i.gap !== null && i.gap > 0).sort((a, b) => (b.gap ?? 0) - (a.gap ?? 0));
  const weakest = [...items].sort((a, b) => a.rate - b.rate);
  return { games: reviewed.length, items, keyHabits, weakest };
}
