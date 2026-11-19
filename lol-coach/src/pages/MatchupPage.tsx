import { useState } from 'react';
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

const LANE_LABEL: Record<Lane, string> = { top: 'トップ', mid: 'ミッド', bot: 'ボット' };

function Select<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Record<T, string>; onChange: (v: T) => void }) {
  return (
    <label className="field">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {(Object.keys(options) as T[]).map((k) => (
          <option key={k} value={k}>
            {options[k]}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MatchupPage() {
  const [input, setInput] = useState<MatchupInput>({
    level6: false,
    top: { ally: 'tank', enemy: 'tank' },
    mid: { ally: 'rangedFarm', enemy: 'rangedFarm' },
    bot: { adc: 'bully', support: 'cc' },
  });
  const result = evaluateMatchup(input);
  const set = (fn: (i: MatchupInput) => MatchupInput) => setInput((i) => fn(i));

  return (
    <div className="stack">
      <header className="page-head">
        <h1>ガンク判定</h1>
        <p className="muted">
          味方と敵のチャンピオンのタイプを選ぶと、教科書のルールでガンクの優先順位を判定します。大前提は「ボット ＞ ミッド ＞ トップ」。
        </p>
      </header>

      <div className="grid grid-2">
        <section className="card stack">
          <h2>構図を入力</h2>
          <label className="row">
            <input type="checkbox" checked={input.level6} onChange={(e) => set((i) => ({ ...i, level6: e.target.checked }))} />
            レベル6以降（ヴォイドグラブ出現のタイミング）
          </label>
          <h3>トップ</h3>
          <div className="grid grid-2">
            <Select<TopType> label="味方" value={input.top.ally} options={TOP_LABEL} onChange={(v) => set((i) => ({ ...i, top: { ...i.top, ally: v } }))} />
            <Select<TopType> label="敵" value={input.top.enemy} options={TOP_LABEL} onChange={(v) => set((i) => ({ ...i, top: { ...i.top, enemy: v } }))} />
          </div>
          <h3>ミッド</h3>
          <div className="grid grid-2">
            <Select<MidType> label="味方" value={input.mid.ally} options={MID_LABEL} onChange={(v) => set((i) => ({ ...i, mid: { ...i.mid, ally: v } }))} />
            <Select<MidType> label="敵" value={input.mid.enemy} options={MID_LABEL} onChange={(v) => set((i) => ({ ...i, mid: { ...i.mid, enemy: v } }))} />
          </div>
          <h3>ボット（味方）</h3>
          <div className="grid grid-2">
            <Select<AdcType> label="ADC" value={input.bot.adc} options={ADC_LABEL} onChange={(v) => set((i) => ({ ...i, bot: { ...i.bot, adc: v } }))} />
            <Select<SupportType> label="サポート" value={input.bot.support} options={SUPPORT_LABEL} onChange={(v) => set((i) => ({ ...i, bot: { ...i.bot, support: v } }))} />
          </div>
        </section>

        <section className="stack">
          {result.firstTurn && (
            <div className="status-banner continue">初手ターンは「トップ」へ。味方トップが遠距離ディーラーの時は、最初のターンだけ例外的にトップを見てあげます。</div>
          )}
          {result.priority.map((lane, i) => {
            const ev = result.lanes[lane];
            return (
              <div key={lane} className={`card lane-result l${ev.level}`}>
                <div className="row">
                  <span className="rank-badge">{i + 1}</span>
                  <h2 style={{ margin: 0 }}>{LANE_LABEL[lane]}</h2>
                  <span className={`chip ${ev.level > 0 ? 'chip-gold' : ''}`}>{IMPORTANCE_LABEL[ev.level]}</span>
                </div>
                <ul className="small" style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                  {ev.reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            );
          })}
          <p className="muted small">
            ※ 判定は「すべての条件が同じ」場合の目安です。実際のレーン状況（体力、スペル、ウェーブ、視界）を見て柔軟に変更しましょう。
          </p>
        </section>
      </div>
    </div>
  );
}
