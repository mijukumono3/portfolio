import { championToInput, applyChampionToMatchup, setMatchupState } from './matchupState';
import { CHAMPIONS } from './core/champions';
import type { MatchupInput } from './core/matchup';

const base: MatchupInput = {
  level6: false,
  top: { ally: 'tank', enemy: 'tank' },
  mid: { ally: 'rangedFarm', enemy: 'rangedFarm' },
  bot: { adc: 'even', support: 'utility' },
};
const champ = (n: string) => CHAMPIONS.find((c) => c.name === n)!;

describe('championToInput', () => {
  it('枠に合う分類を反映する', () => {
    expect(championToInput(base, champ('ジェイス'), 'topAlly')?.top.ally).toBe('ranged');
    expect(championToInput(base, champ('タロン'), 'midEnemy')?.mid.enemy).toBe('roam1');
    expect(championToInput(base, champ('レオナ'), 'support')?.bot.support).toBe('cc');
  });
  it('分類を持たない枠ならnull', () => {
    expect(championToInput(base, champ('レオナ'), 'topAlly')).toBeNull();
  });
  it('applyで名前も記録される', () => {
    setMatchupState(() => ({ input: base, names: {} }));
    expect(applyChampionToMatchup(champ('ケイトリン'), 'adc')).toBe(true);
    expect(applyChampionToMatchup(champ('ケイトリン'), 'support')).toBe(false);
  });
});
