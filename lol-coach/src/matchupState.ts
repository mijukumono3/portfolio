// ガンク判定の入力内容（画面を移動しても保持する。メイン/ミニの各ウィンドウ内で共有）
import { useSyncExternalStore } from 'react';
import type { Champion } from './core/champions';
import type { MatchupInput } from './core/matchup';

export type MatchupSlot = 'topAlly' | 'topEnemy' | 'midAlly' | 'midEnemy' | 'adc' | 'support';

export interface MatchupState {
  input: MatchupInput;
  names: Partial<Record<MatchupSlot, string>>;
}

let state: MatchupState = {
  input: {
    level6: false,
    top: { ally: 'tank', enemy: 'tank' },
    mid: { ally: 'rangedFarm', enemy: 'rangedFarm' },
    bot: { adc: 'bully', support: 'cc' },
  },
  names: {},
};
const listeners = new Set<() => void>();

export function setMatchupState(fn: (s: MatchupState) => MatchupState) {
  state = fn(state);
  listeners.forEach((l) => l());
}

export function useMatchupState(): MatchupState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

/** チャンピオンの分類を指定した枠に反映する。該当する分類がなければ false */
export function championToInput(input: MatchupInput, champ: Champion, slot: MatchupSlot): MatchupInput | null {
  switch (slot) {
    case 'topAlly':
      return champ.top ? { ...input, top: { ...input.top, ally: champ.top } } : null;
    case 'topEnemy':
      return champ.top ? { ...input, top: { ...input.top, enemy: champ.top } } : null;
    case 'midAlly':
      return champ.mid ? { ...input, mid: { ...input.mid, ally: champ.mid } } : null;
    case 'midEnemy':
      return champ.mid ? { ...input, mid: { ...input.mid, enemy: champ.mid } } : null;
    case 'adc':
      return champ.adc ? { ...input, bot: { ...input.bot, adc: champ.adc } } : null;
    case 'support':
      return champ.support ? { ...input, bot: { ...input.bot, support: champ.support } } : null;
  }
}

export function applyChampionToMatchup(champ: Champion, slot: MatchupSlot): boolean {
  const next = championToInput(state.input, champ, slot);
  if (!next) return false;
  setMatchupState((s) => ({ input: next, names: { ...s.names, [slot]: champ.name } }));
  return true;
}
