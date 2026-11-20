import { Icon, PageHeader, Panel } from '../components/ui';
import { ChampionInput } from '../components/ChampionInput';
import { setMatchupState, useMatchupState, type MatchupSlot } from '../matchupState';
import {
  ADC_LABEL,
  evaluateMatchup,
  IMPORTANCE_LABEL,
  MID_LABEL,
  SUPPORT_LABEL,
  TOP_LABEL,
  type AdcType,
  type Lane,
  type MatchupInput,
  type MidType,
  type SupportType,
  type TopType,
} from '../core/matchup';

export const LANE_LABEL: Record<Lane, string> = { top: 'トップ', mid: 'ミッド', bot: 'ボット' };
const MARKER_POS: Record<Lane, { left: string; top: string }> = {
  top: { left: '13%', top: '13%' },
  mid: { left: '50%', top: '50%' },
  bot: { left: '87%', top: '87%' },
};

export function Select<T extends string>({
  label,
  side,
  slot,
  value,
  options,
  onChange,
}: {
  label: string;
  side?: 'ally' | 'enemy';
  slot?: MatchupSlot;
  value: T;
  options: Record<T, string>;
  onChange: (v: T) => void;
}) {
  return (
    <div className={`field ${side ?? ''}`}>
      <span>
        {side && <span className={`chip ${side === 'ally' ? 'chip-ally' : 'chip-enemy'}`}>{side === 'ally' ? '味方' : '敵'}</span>} {label}
      </span>
      {slot && <ChampionInput slot={slot} />}
      <select aria-label={`${side === 'ally' ? '味方' : side === 'enemy' ? '敵' : ''}${label}のタイプ`} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {(Object.keys(options) as T[]).map((k) => (
          <option key={k} value={k}>
            {options[k]}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Minimap({ priority, levels }: { priority: Lane[]; levels: Record<Lane, number> }) {
  return (
    <div className="minimap" role="img" aria-label={`ガンク優先順位：${priority.map((l) => LANE_LABEL[l]).join('、')}`}>
      <svg viewBox="0 0 100 100" aria-hidden>
        <path d="M 4 70 Q 40 60 50 50 Q 60 40 96 30" fill="none" stroke="rgba(79,179,232,0.18)" strokeWidth="7" strokeLinecap="round" />
        <g fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 13 88 L 13 13 L 88 13" stroke={levels.top ? 'rgba(240,226,182,0.6)' : 'rgba(255,255,255,0.16)'} />
          <path d="M 16 84 L 84 16" stroke={levels.mid ? 'rgba(240,226,182,0.6)' : 'rgba(255,255,255,0.16)'} />
          <path d="M 12 87 L 87 87 L 87 12" stroke={levels.bot ? 'rgba(240,226,182,0.6)' : 'rgba(255,255,255,0.16)'} />
        </g>
        <circle cx="9" cy="91" r="6" fill="rgba(58,167,230,0.55)" />
        <circle cx="91" cy="9" r="6" fill="rgba(229,84,95,0.55)" />
      </svg>
      {(['top', 'mid', 'bot'] as Lane[]).map((lane) => (
        <div key={lane} className={`lane-marker l${levels[lane]} ${lane === 'bot' ? 'label-up' : ''}`} style={MARKER_POS[lane]}>
          <span className="rank">{priority.indexOf(lane) + 1}</span>
          <span className="name">{LANE_LABEL[lane]}</span>
        </div>
      ))}
    </div>
  );
}

export function MatchupPage() {
  const { input } = useMatchupState();
  const result = evaluateMatchup(input);
  const set = (fn: (i: MatchupInput) => MatchupInput) => setMatchupState((s) => ({ ...s, input: fn(s.input) }));
  const levels = { top: result.lanes.top.level, mid: result.lanes.mid.level, bot: result.lanes.bot.level };

  return (
    <div className="stack">
      <PageHeader eyebrow="GANK PRIORITY" title="ガンク判定">
        味方と敵のチャンピオンのタイプを選ぶと、教科書のルールでガンクの優先順位を判定します。大前提は「ボット ＞ ミッド ＞ トップ」。
      </PageHeader>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <Panel title="構図を入力" icon="pen">
          <button className="toggle" style={{ width: '100%', textAlign: 'left' }} onClick={() => set((i) => ({ ...i, level6: !i.level6 }))} aria-pressed={input.level6}>
            <span>
              <strong>レベル6以降</strong>
              <span className="small muted" style={{ display: 'block' }}>
                アルティメット解禁・ヴォイドグラブ出現のタイミング
              </span>
            </span>
            <span className={`switch ${input.level6 ? 'on' : ''}`} />
          </button>

          <div className="lane-block">
            <h3>トップ</h3>
            <div className="lane-input">
              <Select<TopType> label="" slot="topAlly" side="ally" value={input.top.ally} options={TOP_LABEL} onChange={(v) => set((i) => ({ ...i, top: { ...i.top, ally: v } }))} />
              <Select<TopType> label="" slot="topEnemy" side="enemy" value={input.top.enemy} options={TOP_LABEL} onChange={(v) => set((i) => ({ ...i, top: { ...i.top, enemy: v } }))} />
            </div>
          </div>
          <div className="lane-block">
            <h3>ミッド</h3>
            <div className="lane-input">
              <Select<MidType> label="" slot="midAlly" side="ally" value={input.mid.ally} options={MID_LABEL} onChange={(v) => set((i) => ({ ...i, mid: { ...i.mid, ally: v } }))} />
              <Select<MidType> label="" slot="midEnemy" side="enemy" value={input.mid.enemy} options={MID_LABEL} onChange={(v) => set((i) => ({ ...i, mid: { ...i.mid, enemy: v } }))} />
            </div>
          </div>
          <div className="lane-block">
            <h3>
              ボット <span className="chip chip-ally">味方</span>
              <span className="small muted">サポート70% : ADC30%</span>
            </h3>
            <div className="lane-input">
              <Select<AdcType> label="ADC" slot="adc" value={input.bot.adc} options={ADC_LABEL} onChange={(v) => set((i) => ({ ...i, bot: { ...i.bot, adc: v } }))} />
              <Select<SupportType> label="サポート" slot="support" value={input.bot.support} options={SUPPORT_LABEL} onChange={(v) => set((i) => ({ ...i, bot: { ...i.bot, support: v } }))} />
            </div>
          </div>
        </Panel>

        <div className="stack">
          <Panel title="判定結果" icon="map" action={<span className="chip chip-gold">最優先：{LANE_LABEL[result.priority[0]]}</span>}>
            <Minimap priority={result.priority} levels={levels} />
            {result.firstTurn && (
              <div className="callout" style={{ marginTop: 16 }}>
                <Icon name="flame" />
                <span>
                  <strong>初手ターンはトップへ。</strong>味方トップが遠距離ディーラーの時は、最初のターンだけ例外的にトップを見てあげます。
                </span>
              </div>
            )}
          </Panel>
          {result.priority.map((lane, i) => {
            const ev = result.lanes[lane];
            return (
              <div key={lane} className={`lane-card l${ev.level}`}>
                <span className="rank-num num">{i + 1}</span>
                <div>
                  <div className="row">
                    <h2 style={{ fontSize: 16 }}>{LANE_LABEL[lane]}</h2>
                    <span className={`chip ${ev.level === 2 ? 'chip-gold' : ev.level === 1 ? 'chip-ally' : ''}`}>{IMPORTANCE_LABEL[ev.level]}</span>
                  </div>
                  <ul>
                    {ev.reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
          <p className="muted small">※ 「すべての条件が同じ」場合の目安です。体力・スペル・ウェーブ・視界など実際のレーン状況を見て柔軟に変更しましょう。</p>
        </div>
      </div>
    </div>
  );
}
