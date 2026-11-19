// 教科書に登場するチャンピオンの分類辞書
// 出典: 各レーンの重要度（トップ/ミッド/ボットのタイプ分類）、サブロール別チャンピオン選択のTip、ジャングルチャンピオン50選
import type { AdcType, MidType, SupportType, TopType } from './matchup';
import type { Section } from './search';

export interface Champion {
  name: string;
  en?: string;
  top?: TopType;
  mid?: MidType;
  adc?: AdcType;
  support?: SupportType;
  jungle?: boolean;
}

const entries: [Partial<Champion>, string[]][] = [
  [{ top: 'tank' }, ['マルファイト', 'シェン', 'ボリベア', 'マオカイ', 'オーン', 'ドクター・ムンド', 'サイオン']],
  [{ top: 'bruiser' }, ['ダリウス', 'イレリア', 'レネクトン', 'エイトロックス', 'グラガス', 'カミール', 'ジャックス', 'トリンダメア', 'オラフ']],
  [{ top: 'ranged' }, ['ジェイス', 'クイン', 'ハイマーディンガー', 'ルシアン', 'カリスタ', 'ヴェイン']],
  [{ mid: 'roam1' }, ['タロン', 'ルブラン', 'カタリナ', 'アクシャン', 'キヤナ']],
  [{ mid: 'roam2' }, ['アーリ', 'ゼド', 'オーロラ', 'リサンドラ', 'ニーコ']],
  [{ mid: 'roam3' }, ['ツイステッド・フェイト', 'ライズ', 'パンテオン', 'ガリオ', 'タリヤ']],
  [{ mid: 'meleeDuel' }, ['イレリア', 'ヤスオ']],
  [{ adc: 'bully' }, ['サミーラ', 'カイ＝サ', 'ケイトリン', 'ヴァルス']],
  [{ adc: 'even' }, ['ヴェイン', 'アフェリオス', 'ジンクス', 'シヴィア']],
  [{ adc: 'cc' }, ['ジン', 'アッシュ']],
  [{ support: 'cc' }, ['レオナ', 'レル', 'アリスター', 'ブリッツクランク', 'マオカイ', 'ノーチラス', 'ガリオ']],
  [{ support: 'softCc' }, ['スレッシュ', 'ブラウム', 'タリック', 'ポッピー']],
  [{ support: 'utility' }, ['セラフィーン', 'ルル', 'ユーミ', 'ジャンナ']],
  [{ support: 'poke' }, ['セナ', 'カルマ', 'ラックス', 'ザイラ', 'ニーコ']],
  [{ support: 'roam' }, ['バード', 'パイク']],
  [
    { jungle: true },
    [
      'ゼド', 'フィドルスティックス', 'ダリウス', 'グレイブス', 'グラガス', 'グウェン', 'ナフィーリ', 'ノクターン', 'ヌヌ＆ウィルンプ', 'ニダリー',
      'ダイアナ', 'ラムス', 'レク＝サイ', 'レンガ', 'リー・シン', 'リリア', 'マスター・イー', 'マオカイ', 'ヴァイ', 'ベル＝ヴェス',
      'ボリベア', 'ブライアー', 'ブランド', 'シン・ジャオ', 'ウーコン', 'ジャーヴァンIV', 'キンドレッド',
    ],
  ],
  [{}, ['アカリ', 'ヨネ']],
];

const EN: Record<string, string> = {
  ゼド: 'Zed', フィドルスティックス: 'Fiddlesticks', ダリウス: 'Darius', グレイブス: 'Graves', グラガス: 'Gragas', グウェン: 'Gwen',
  ナフィーリ: 'Naafiri', ノクターン: 'Nocturne', 'ヌヌ＆ウィルンプ': 'Nunu & Willump', ニダリー: 'Nidalee', ダイアナ: 'Diana',
  ラムス: 'Rammus', 'レク＝サイ': "Rek'Sai", レンガ: 'Rengar', 'リー・シン': 'Lee Sin', リリア: 'Lillia', 'マスター・イー': 'Master Yi',
  マオカイ: 'Maokai', ヴァイ: 'Vi', 'ベル＝ヴェス': "Bel'Veth", ボリベア: 'Volibear', ブライアー: 'Briar', ブランド: 'Brand',
  アカリ: 'Akali', カタリナ: 'Katarina', パンテオン: 'Pantheon', リサンドラ: 'Lissandra', ライズ: 'Ryze', ヨネ: 'Yone', ルブラン: 'LeBlanc',
  レオナ: 'Leona', スレッシュ: 'Thresh', セナ: 'Senna', カルマ: 'Karma', ルル: 'Lulu', ジンクス: 'Jinx', ケイトリン: 'Caitlyn',
  'カイ＝サ': "Kai'Sa", ヤスオ: 'Yasuo', イレリア: 'Irelia', アーリ: 'Ahri', タロン: 'Talon', カミール: 'Camille', ジャックス: 'Jax',
  マルファイト: 'Malphite', シェン: 'Shen', オーン: 'Ornn', ジェイス: 'Jayce', ヴェイン: 'Vayne', 'ツイステッド・フェイト': 'Twisted Fate',
  ガリオ: 'Galio', バード: 'Bard', パイク: 'Pyke', アッシュ: 'Ashe', ジン: 'Jhin', ノーチラス: 'Nautilus', ブリッツクランク: 'Blitzcrank',
};

export const CHAMPIONS: Champion[] = (() => {
  const map = new Map<string, Champion>();
  for (const [props, names] of entries) {
    for (const name of names) {
      const cur = map.get(name) ?? { name, en: EN[name] };
      // 先に定義された分類を優先（例: イレリアはトップ=ブルーザー、ミッド=近接1v1 の両方を持つ）
      for (const [k, v] of Object.entries(props) as [keyof Champion, never][]) {
        if (cur[k] === undefined) cur[k] = v;
      }
      map.set(name, cur);
    }
  }
  return [...map.values()];
})();

/** かな/カナ・全角半角・記号・空白・大小文字の違いを吸収する */
export function normalizeName(s: string): string {
  return s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/[\s・=＝&＆'’.\-]/g, '');
}

export function searchChampions(query: string, limit = 20): Champion[] {
  const q = normalizeName(query);
  if (!q) return [];
  const scored: { c: Champion; score: number; i: number }[] = [];
  CHAMPIONS.forEach((c, i) => {
    const keys = [normalizeName(c.name), c.en ? normalizeName(c.en) : ''];
    const score = keys.some((k) => k.startsWith(q)) ? 0 : keys.some((k) => k && k.includes(q)) ? 1 : -1;
    if (score >= 0) scored.push({ c, score, i });
  });
  return scored
    .sort((a, b) => a.score - b.score || a.i - b.i)
    .slice(0, limit)
    .map((x) => x.c);
}

/** 教科書内のチャンピオン別ガイド章（「11. ダイアナ (Diana)」「3. ダイアナ完全攻略ガイド」形式の見出し） */
export function guideSectionsFor(name: string, sections: Section[]): Section[] {
  const n = normalizeName(name);
  return sections.filter((s) => {
    const m = s.title.match(/^\d+\.\s*(.+?)\s*(?:\(|完全攻略|$)/);
    return m ? normalizeName(m[1]) === n : false;
  });
}
