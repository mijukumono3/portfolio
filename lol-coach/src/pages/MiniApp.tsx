import { ChampionInput } from '../components/ChampionInput';
import { Panel } from '../components/ui';
import { evaluateMatchup, IMPORTANCE_LABEL, type Lane } from '../core/matchup';
import { BASE_SET, evaluateSession, type GameResult } from '../core/session';
import { setMatchupState, useMatchupState } from '../matchupState';
import { todayKey, useStore, type DaySession } from '../store';
import { LANE_LABEL } from './MatchupPage';

/** 試合中に横に置く、常に最前面の小さなウィンドウ */
export function MiniApp() {
  const { data, update, loaded } = useStore();
  const { input, names } = useMatchupState();
  const date = todayKey();
  const today: DaySession = data.sessions.find((s) => s.date === date) ?? { date, results: [], notes: [] };
  const ev = evaluateSession(today.results);
  const result = evaluateMatchup(input);
  const slots = Math.max(BASE_SET, today.results.length + (ev.status === 'continue' ? 1 : 0));

  const saveToday = (fn: (s: DaySession) => DaySession) =>
    update((d) => {
      const cur = d.sessions.find((s) => s.date === date) ?? { date, results: [], notes: [] };
      return { ...d, sessions: [...d.sessions.filter((s) => s.date !== date), fn(cur)] };
    });
  const record = (r: GameResult) => saveToday((s) => ({ ...s, results: [...s.results, r], notes: [...s.notes, ''] }));
  const undo = () => saveToday((s) => ({ ...s, results: s.results.slice(0, -1), notes: s.notes.slice(0, -1) }));
  const top = result.priority[0];
  const firstReason = result.lanes[top].reasons[0];

  if (!loaded) return <p className="muted" style={{ padding: 16 }}>読み込み中…</p>;

  return (
    <div className="mini">
      <Panel title="3戦セット" icon="swords" action={<span className="chip num">{ev.wins}勝 {ev.losses}敗</span>}>
        <div className="stack-sm">
          <div className="pips">
            {Array.from({ length: slots }, (_, i) => {
              const r = today.results[i];
              const isNext = !r && i === today.results.length && ev.status === 'continue';
              return (
                <div key={i} className={`pip ${r ?? ''} ${isNext ? 'next' : ''} ${i >= BASE_SET ? 'ext' : ''}`}>
                  <b>{r ?? (isNext ? '▶' : i + 1)}</b>
                </div>
              );
            })}
          </div>
          <div className={`verdict ${ev.status}`}>
            <span className="dot" />
            <span>{ev.reason}</span>
          </div>
          <div className="result-btns">
            <button className="btn-win" disabled={ev.status === 'stop'} onClick={() => record('W')}>
              勝ち
            </button>
            <button className="btn-loss" disabled={ev.status === 'stop'} onClick={() => record('L')}>
              負け
            </button>
          </div>
          <button className="btn btn-ghost" disabled={today.results.length === 0} onClick={undo}>
            1つ戻す
          </button>
        </div>
      </Panel>

      <Panel
        title="ガンク判定"
        icon="map"
        action={
          <button
            className={`chip ${input.level6 ? 'chip-gold' : ''}`}
            style={{ cursor: 'pointer', background: 'none' }}
            aria-pressed={input.level6}
            onClick={() => setMatchupState((s) => ({ ...s, input: { ...s.input, level6: !s.input.level6 } }))}
          >
            Lv6{input.level6 ? '以降' : '前'}
          </button>
        }
      >
        <div className="mini-result" aria-label="ガンク優先順位">
          {result.priority.map((lane: Lane, i) => (
            <div key={lane} className={`lane-pill l${result.lanes[lane].level}`}>
              <b className="num">{i + 1}</b>
              {LANE_LABEL[lane]}
              <div className="small muted">{IMPORTANCE_LABEL[result.lanes[lane].level]}</div>
            </div>
          ))}
        </div>
        {result.firstTurn && (
          <p className="small" style={{ marginTop: 8, color: '#9fd6f5' }}>
            初手ターンはトップへ（味方トップが遠距離ディーラー）
          </p>
        )}
        <p className="small muted" style={{ margin: '8px 0 12px' }}>
          {firstReason}
        </p>
        <div className="mini-lane small muted">
          <span />
          <span className="chip chip-ally" style={{ justifySelf: 'start' }}>
            味方
          </span>
          <span className="chip chip-enemy" style={{ justifySelf: 'start' }}>
            敵
          </span>
        </div>
        <div className="mini-lane">
          <strong>トップ</strong>
          <ChampionInput slot="topAlly" compact />
          <ChampionInput slot="topEnemy" compact />
        </div>
        <div className="mini-lane">
          <strong>ミッド</strong>
          <ChampionInput slot="midAlly" compact />
          <ChampionInput slot="midEnemy" compact />
        </div>
        <div className="mini-lane">
          <strong>ボット</strong>
          <ChampionInput slot="adc" compact />
          <ChampionInput slot="support" compact />
        </div>
        <div className="small muted" style={{ marginBottom: 10 }}>
          ボットは味方の ADC / サポート。{Object.values(names).some(Boolean) ? '' : '名前を入れるとタイプが自動で入ります。'}
        </div>
      </Panel>
    </div>
  );
}
