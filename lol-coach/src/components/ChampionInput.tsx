import { CHAMPIONS, normalizeName } from '../core/champions';
import { championToInput, setMatchupState, useMatchupState, type MatchupSlot } from '../matchupState';

const SLOT_KEY: Record<MatchupSlot, 'top' | 'mid' | 'adc' | 'support'> = {
  topAlly: 'top',
  topEnemy: 'top',
  midAlly: 'mid',
  midEnemy: 'mid',
  adc: 'adc',
  support: 'support',
};

/** チャンピオン名を入れると、教科書の分類でガンク判定のタイプを自動選択する入力欄 */
export function ChampionInput({ slot, compact = false }: { slot: MatchupSlot; compact?: boolean }) {
  const { names } = useMatchupState();
  const key = SLOT_KEY[slot];
  const candidates = CHAMPIONS.filter((c) => c[key] !== undefined);
  const value = names[slot] ?? '';
  const match = value ? candidates.find((c) => normalizeName(c.name) === normalizeName(value) || (c.en && normalizeName(c.en) === normalizeName(value))) : undefined;
  const listId = `champs-${key}`;

  const onChange = (text: string) => {
    const champ = candidates.find((c) => normalizeName(c.name) === normalizeName(text) || (c.en && normalizeName(c.en) === normalizeName(text)));
    setMatchupState((s) => {
      const next = champ ? championToInput(s.input, champ, slot) : null;
      return { input: next ?? s.input, names: { ...s.names, [slot]: text } };
    });
  };

  return (
    <div className="champ-input">
      <input
        type="text"
        list={listId}
        aria-label="チャンピオン名"
        placeholder={compact ? 'チャンピオン名' : 'チャンピオン名で自動入力'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={match ? 'matched' : value ? 'unmatched' : ''}
      />
      <datalist id={listId}>
        {candidates.map((c) => (
          <option key={c.name} value={c.name} />
        ))}
      </datalist>
      {value && !match && !compact && <span className="small muted">教科書の分類にないため、タイプを手動で選んでください</span>}
    </div>
  );
}
