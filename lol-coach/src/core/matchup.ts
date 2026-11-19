// 教科書「各レーンの重要度」に基づくガンク優先度の判定
// 重要度: 0 = 重要X / 1 = 重要O / 2 = 最重要O

export type Lane = 'top' | 'mid' | 'bot';
export type TopType = 'tank' | 'bruiser' | 'ranged';
export type MidType = 'roam1' | 'roam2' | 'roam3' | 'meleeDuel' | 'rangedFarm' | 'laneBully';
export type AdcType = 'bully' | 'even' | 'cc';
export type SupportType = 'cc' | 'softCc' | 'utility' | 'poke' | 'roam';
export type Importance = 0 | 1 | 2;

export interface LaneEvaluation {
  lane: Lane;
  level: Importance;
  reasons: string[];
  score?: number;
  firstTurn?: boolean;
}

export interface MatchupInput {
  level6: boolean;
  top: { ally: TopType; enemy: TopType };
  mid: { ally: MidType; enemy: MidType };
  bot: { adc: AdcType; support: SupportType };
}

export interface MatchupResult {
  lanes: Record<Lane, LaneEvaluation>;
  /** ガンク優先順位（高い順） */
  priority: Lane[];
  /** 初手ターンだけ別のレーンを見るべき場合 */
  firstTurn?: Lane;
}

export const IMPORTANCE_LABEL: Record<Importance, string> = { 0: '重要 X', 1: '重要 O', 2: '最重要 O' };

export const TOP_LABEL: Record<TopType, string> = {
  tank: 'タンク（マルファイト、シェン、オーン等）',
  bruiser: 'ブルーザー（ダリウス、カミール、ジャックス等）',
  ranged: '遠距離ディーラー（ジェイス、クイン、ヴェイン等）',
};
export const MID_LABEL: Record<MidType, string> = {
  roam1: 'ローム1ティア（タロン、ルブラン、カタリナ、アクシャン、キヤナ）',
  roam2: 'ローム2ティア（アーリ、ゼド、オーロラ、リサンドラ、ニーコ）',
  roam3: 'ローム3ティア（TF、ライズ、パンテオン、ガリオ、タリヤ）',
  meleeDuel: '近接1v1（イレリア、ヤスオ等）',
  rangedFarm: '遠距離ファーム',
  laneBully: 'レーン戦が強い',
};
export const ADC_LABEL: Record<AdcType, string> = {
  bully: 'レーン戦が強い（サミーラ、カイ＝サ、ケイトリン等）',
  even: '五分五分ファーム（ヴェイン、ジンクス、シヴィア等）',
  cc: 'CCタイプ（ジン、アッシュ）',
};
export const SUPPORT_LABEL: Record<SupportType, string> = {
  cc: 'CC（レオナ、レル、アリスター、ノーチラス等）',
  softCc: 'ソフトCC（スレッシュ、ブラウム、タリック等）',
  utility: 'ユーティリティ（ルル、ユーミ、ジャンナ等）',
  poke: '牽制（セナ、カルマ、ラックス等）',
  roam: 'ローム（バード、パイク）',
};

export function evaluateTop(ally: TopType, enemy: TopType, level6: boolean): LaneEvaluation {
  if (ally === 'ranged') {
    return {
      lane: 'top',
      level: 1,
      firstTurn: true,
      reasons: [
        '遠距離ディーラーはダイブや敵ジャングル侵攻を可能にするが、一度倒されると立て直しにくい。',
        '他のレーンに「重要」があっても、最初のターン（下から上へのルート）はトップを見てあげる。',
      ],
    };
  }
  if (enemy === 'ranged') {
    return level6
      ? {
          lane: 'top',
          level: 1,
          reasons: [
            'Lv6以降はタンク/ブルーザーが強力なCCを持ち、ブリンクの少ない遠距離ディーラーを捕まえやすい。',
            'Lv6のタイミングでヴォイドグラブが出現する。ディーラーを倒せばグラブも取りやすい。',
          ],
        }
      : { lane: 'top', level: 0, reasons: ['Lv6前はCCが弱く、遠距離ディーラーを捕まえにくい。Lv6以降に重要度が上がる。'] };
  }
  if (ally === 'bruiser' && enemy === 'bruiser') {
    return {
      lane: 'top',
      level: 1,
      reasons: ['ブルーザー同士は殴り合いが激しく体力が削れやすい。ブリンクの有無で「離脱しにくい構図」を見極めよう。'],
    };
  }
  return {
    lane: 'top',
    level: 0,
    reasons: ['タンクが絡む構図はガンクしても倒しにくく、得られる利益（リターン）がほぼない。タンクが自力で耐えられるなら行く理由はない。'],
  };
}

export function evaluateMid(ally: MidType, enemy: MidType, level6: boolean): LaneEvaluation {
  switch (ally) {
    case 'roam1':
      return { lane: 'mid', level: 1, reasons: ['1ティアロームはレーン戦・ローム力・CCをすべて備え、Lv6前からロームできる。ガンクの見返りが確実。'] };
    case 'roam2':
    case 'roam3':
      return level6
        ? { lane: 'mid', level: 1, reasons: ['Lv6以降はロームが可能になり、ガンク後に一緒にロームする見返りがある。'] }
        : { lane: 'mid', level: 0, reasons: ['Lv6前はロームできず、ガンクしてもすぐの見返りが少ない。'] };
    case 'rangedFarm':
      return {
        lane: 'mid',
        level: 0,
        reasons: ['生存スキルが少なくガンク合わせも弱い。ガンクより「ミッド周辺の視界確保」で倒されないようにしてあげる。'],
      };
    case 'laneBully':
      return { lane: 'mid', level: 1, reasons: ['直接のガンク合わせは弱いが、視界を確保してレーン主導権を握らせると、ジャングラーへの貢献度が高い。'] };
    case 'meleeDuel':
      return enemy === 'meleeDuel'
        ? { lane: 'mid', level: 2, reasons: ['近接同士は常にダメージ交換が起き体力が削れている。先にガンクした側が勝つ最重要レーン。'] }
        : { lane: 'mid', level: 1, reasons: ['近接1v1は体力が削れやすく、敵ジャングラーに常に狙われる。カウンターガンクの機会も多い。'] };
  }
}

const SUPPORT_POINT: Record<SupportType, number> = { cc: 1, softCc: 0.75, utility: 0, poke: 1, roam: 1 };
const ADC_POINT: Record<AdcType, number> = { bully: 1, even: 0, cc: 0.75 };

export function evaluateBot(adc: AdcType, support: SupportType): LaneEvaluation {
  const score = Math.round((SUPPORT_POINT[support] * 0.7 + ADC_POINT[adc] * 0.3) * 100) / 100;
  const level: Importance = score >= 1 ? 2 : score >= 0.3 ? 1 : 0;
  const reasons = [`サポート70% : ADC30% で評価（スコア ${score}）。ボットの状況とガンク能力はサポートで決まる。`];
  if (support === 'poke') reasons.push('牽制サポートは直接のガンクは難しいが、敵ジャングラーを呼び込むので「カウンターガンク」が狙える。');
  if (support === 'roam') reasons.push('敵がプッシュすればボットへガンク、フリーズすればサポートと一緒に他レーンへ。');
  if (support === 'cc') reasons.push('CCサポートは戦闘を仕掛ける力が高い。ブッシュやタワー裏に隠れて仕掛けた瞬間にガンク。');
  if (level === 0) reasons.push('ガンクの見返りが小さい。視界管理と他レーンを優先。');
  return { lane: 'bot', level, score, reasons };
}

const LANE_ORDER: Lane[] = ['bot', 'mid', 'top'];

export function evaluateMatchup(input: MatchupInput): MatchupResult {
  const lanes: Record<Lane, LaneEvaluation> = {
    top: evaluateTop(input.top.ally, input.top.enemy, input.level6),
    mid: evaluateMid(input.mid.ally, input.mid.enemy, input.level6),
    bot: evaluateBot(input.bot.adc, input.bot.support),
  };
  const priority = [...LANE_ORDER].sort((a, b) => lanes[b].level - lanes[a].level || LANE_ORDER.indexOf(a) - LANE_ORDER.indexOf(b));
  return { lanes, priority, firstTurn: lanes.top.firstTurn ? 'top' : undefined };
}
