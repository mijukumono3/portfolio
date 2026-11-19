import { useEffect, useState } from 'react';
import { BASE_SET, evaluateSession, type GameResult } from '../core/session';
import { todayKey, useStore, type DaySession } from '../store';

function WorkoutTimer() {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (left === null || left <= 0) return;
    const t = window.setTimeout(() => setLeft((l) => (l === null ? null : l - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [left]);
  const mm = String(Math.floor((left ?? 0) / 60)).padStart(2, '0');
  const ss = String((left ?? 0) % 60).padStart(2, '0');
  return (
    <section className="card">
      <h2>試合の合間に「筋トレ」</h2>
      <p className="small muted">腕立て伏せを1〜2セット、限界まで。体と脳を覚醒させてから次の試合へ。</p>
      <div className="row">
        <span className="timer">{left === null ? '02:00' : `${mm}:${ss}`}</span>
        {left === 0 && <span className="chip chip-gold">休憩終了！次の試合へ</span>}
      </div>
      <div className="row">
        <button className="btn btn-primary" onClick={() => setLeft(120)}>
          2分スタート
        </button>
        <button className="btn" onClick={() => setLeft(null)}>
          リセット
        </button>
      </div>
    </section>
  );
}

function WinRateChart({ results }: { results: GameResult[] }) {
  if (results.length < 2) return <p className="muted small">2戦以上記録すると勝率の推移が表示されます。</p>;
  let wins = 0;
  const points = results.map((r, i) => {
    if (r === 'W') wins += 1;
    return (wins / (i + 1)) * 100;
  });
  const w = 600;
  const h = 120;
  const x = (i: number) => (i / (points.length - 1)) * w;
  const y = (v: number) => h - (v / 100) * h;
  const path = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label="通算勝率の推移">
      {[50, 55, 60].map((v) => (
        <line key={v} x1={0} x2={w} y1={y(v)} y2={y(v)} stroke={v === 50 ? '#47526b' : '#2c3a59'} strokeDasharray="4 4" />
      ))}
      <path d={path} fill="none" stroke="#f0d68a" strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function SessionPage() {
  const { data, update } = useStore();
  const date = todayKey();
  const today: DaySession = data.sessions.find((s) => s.date === date) ?? { date, results: [], notes: [] };
  const ev = evaluateSession(today.results);
  const [insight, setInsight] = useState('');
  const allResults = [...data.sessions].sort((a, b) => a.date.localeCompare(b.date)).flatMap((s) => s.results);
  const slots = Math.max(BASE_SET, today.results.length + (ev.status === 'continue' ? 1 : 0));

  const saveToday = (fn: (s: DaySession) => DaySession) =>
    update((d) => {
      const cur = d.sessions.find((s) => s.date === date) ?? { date, results: [], notes: [] };
      return { ...d, sessions: [...d.sessions.filter((s) => s.date !== date), fn(cur)] };
    });
  const record = (r: GameResult) => saveToday((s) => ({ ...s, results: [...s.results, r], notes: [...s.notes, ''] }));
  const undo = () => saveToday((s) => ({ ...s, results: s.results.slice(0, -1), notes: s.notes.slice(0, -1) }));
  const setNote = (i: number, text: string) => saveToday((s) => ({ ...s, notes: s.notes.map((n, j) => (j === i ? text : n)) }));
  const addInsight = () => {
    const text = insight.trim();
    if (!text) return;
    update((d) => ({ ...d, insights: [{ date, text }, ...d.insights] }));
    setInsight('');
  };
  const todayInsights = data.insights.filter((i) => i.date === date);

  return (
    <div className="stack">
      <header className="page-head">
        <h1>3戦セット</h1>
        <p className="muted">
          基本は3戦固定。2連敗したら即終了。3戦で2勝1敗以上なら、負けるまで続行。集中力が続く「90分」を最高のコンディションで。
        </p>
      </header>

      <div className="grid grid-2">
        <section className="card stack">
          <h2>今日のランク戦（{date}）</h2>
          <div className="games">
            {Array.from({ length: slots }, (_, i) => {
              const r = today.results[i];
              return (
                <div key={i} className={`game ${r ?? 'empty'}`} title={i >= BASE_SET ? '延長戦' : `${i + 1}戦目`}>
                  {r ?? i + 1}
                </div>
              );
            })}
          </div>
          <div className={`status-banner ${ev.status}`}>{ev.reason}</div>
          <div className="row">
            <button className="btn btn-win" disabled={ev.status === 'stop'} onClick={() => record('W')}>
              勝ち
            </button>
            <button className="btn btn-loss" disabled={ev.status === 'stop'} onClick={() => record('L')}>
              負け
            </button>
            <button className="btn" disabled={today.results.length === 0} onClick={undo}>
              1つ戻す
            </button>
          </div>
          <div className="muted small">
            今日 {ev.wins}勝{ev.losses}敗 {ev.phase === 'extension' ? '・延長戦中' : ''}
          </div>
        </section>

        <WorkoutTimer />
      </div>

      {today.results.length > 0 && (
        <section className="card stack">
          <h2>試合ごとの振り返り</h2>
          {today.results.map((r, i) => (
            <label key={i} className="field">
              {i + 1}戦目（{r === 'W' ? '勝ち' : '負け'}）— 良かった判断・悪かった判断を一言で
              <textarea style={{ minHeight: 60 }} value={today.notes[i] ?? ''} onChange={(e) => setNote(i, e.target.value)} />
            </label>
          ))}
        </section>
      )}

      <div className="grid grid-2">
        <section className="card stack">
          <h2>「悟り」ノート</h2>
          <p className="small muted">
            著者はプロのリプレイを見て、気づきを毎日9行ずつ言語化しました。ノートが90ページでGM、200ページでチャレンジャー1000LP。今日 {todayInsights.length} / 9 行
          </p>
          <div className="row">
            <input
              className="search"
              style={{ flex: 1, margin: 0 }}
              placeholder="例：ボットのサポートがCCタイプなら、仕掛けを待ってカウンターガンク"
              value={insight}
              onChange={(e) => setInsight(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addInsight()}
            />
            <button className="btn btn-primary" onClick={addInsight}>
              追加
            </button>
          </div>
          <ul className="small" style={{ margin: 0, paddingLeft: 20, maxHeight: 220, overflowY: 'auto' }}>
            {data.insights.slice(0, 50).map((n, i) => (
              <li key={i}>
                <span className="muted">{n.date}</span> {n.text}
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2>通算勝率の推移</h2>
          <WinRateChart results={allResults} />
          <p className="muted small">点線: 50% / 55%（上位20%）/ 60%（上位5%）。勝率は「最強の武器」であり「盾」。</p>
        </section>
      </div>
    </div>
  );
}
