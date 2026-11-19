import { useEffect, useState } from 'react';
import { Icon, PageHeader, Panel } from '../components/ui';
import { BASE_SET, evaluateSession, type GameResult } from '../core/session';
import { CHECKLIST, checklistStats } from '../core/checklist';
import { todayKey, useStore, type DaySession } from '../store';

const REST = 120;

function WorkoutTimer() {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (left === null || left <= 0) return;
    const t = window.setTimeout(() => setLeft((l) => (l === null ? null : l - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [left]);
  const v = left ?? REST;
  const r = 66;
  const c = 2 * Math.PI * r;
  const done = left === 0;
  return (
    <Panel title="試合の合間に「筋トレ」" icon="timer">
      <p className="small muted">腕立て伏せを1〜2セット、限界まで。体と脳を覚醒させてから次の試合へ。</p>
      <div className="timer-wrap">
        <svg viewBox="0 0 150 150" aria-hidden>
          <circle cx="75" cy="75" r={r} fill="none" stroke="var(--track)" strokeWidth="7" />
          <circle
            cx="75"
            cy="75"
            r={r}
            fill="none"
            stroke={done ? 'var(--good)' : 'var(--gold)'}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${(c * v) / REST} ${c}`}
            transform="rotate(-90 75 75)"
            style={{ transition: 'stroke-dasharray 1s linear' }}
          />
        </svg>
        <div className="t" role="timer" aria-live="polite">
          {done ? 'GO!' : `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`}
        </div>
      </div>
      <div className="row" style={{ justifyContent: 'center' }}>
        <button className="btn btn-primary" onClick={() => setLeft(REST)}>
          {left === null || done ? '2分スタート' : 'やり直す'}
        </button>
        <button className="btn btn-ghost" onClick={() => setLeft(null)}>
          リセット
        </button>
      </div>
    </Panel>
  );
}

function WinRateChart({ results }: { results: GameResult[] }) {
  const [hover, setHover] = useState<number | null>(null);
  if (results.length < 2) return <p className="muted small">2戦以上記録すると、通算勝率の推移がここに表示されます。</p>;
  let wins = 0;
  const points = results.map((r, i) => {
    if (r === 'W') wins += 1;
    return Math.round((wins / (i + 1)) * 1000) / 10;
  });
  const w = 600;
  const h = 160;
  const x = (i: number) => (i / (points.length - 1)) * w;
  const y = (v: number) => h - (v / 100) * h;
  const path = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - rect.left) / rect.width) * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, i)));
  };
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label={`通算勝率の推移。最新 ${points[points.length - 1]}%`} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        {[50, 55, 60].map((v) => (
          <line key={v} x1={0} x2={w} y1={y(v)} y2={y(v)} stroke={v === 50 ? '#3a4868' : '#243250'} strokeDasharray="3 5" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={path} fill="none" stroke="var(--gold-2)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={0} y2={h} stroke="#3a4868" vectorEffect="non-scaling-stroke" />}
      </svg>
      {hover !== null && (
        <div className="tooltip" style={{ left: `${(hover / (points.length - 1)) * 100}%`, top: `${(y(points[hover]) / h) * 100}%` }}>
          {hover + 1}戦目 <strong>{points[hover]}%</strong>（{results[hover] === 'W' ? '勝ち' : '負け'}）
        </div>
      )}
      <div className="legend-line">
        <span>点線：50% / 55%（上位20%）/ 60%（上位5%）</span>
        <span style={{ marginLeft: 'auto' }}>最新 {points[points.length - 1]}%</span>
      </div>
    </div>
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
  const undo = () =>
    saveToday((s) => ({ ...s, results: s.results.slice(0, -1), notes: s.notes.slice(0, -1), checks: s.checks?.slice(0, s.results.length - 1) }));
  const setNote = (i: number, text: string) => saveToday((s) => ({ ...s, notes: s.notes.map((n, j) => (j === i ? text : n)) }));
  const toggleCheck = (i: number, id: string) =>
    saveToday((s) => {
      const checks = Array.from({ length: s.results.length }, (_, j) => s.checks?.[j] ?? null);
      const cur = checks[i] ?? [];
      checks[i] = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      return { ...s, checks };
    });
  const stats = checklistStats(data.sessions);
  const addInsight = () => {
    const text = insight.trim();
    if (!text) return;
    update((d) => ({ ...d, insights: [{ date, text }, ...d.insights] }));
    setInsight('');
  };
  const todayInsights = data.insights.filter((i) => i.date === date).length;

  return (
    <div className="stack">
      <PageHeader eyebrow="RULE 1 — 3戦セットの飴と鞭" title="3戦セット">
        基本は3戦固定。2連敗したら即終了。3戦で2勝1敗以上なら、負けるまで続行。集中力が続く「90分」を最高のコンディションで。
      </PageHeader>

      <div className="grid split">
        <Panel title={`今日のランク戦（${date}）`} icon="swords" action={<span className="chip num">{ev.wins}勝 {ev.losses}敗</span>}>
          <div className="stack">
            <div className="pips">
              {Array.from({ length: slots }, (_, i) => {
                const r = today.results[i];
                const isNext = !r && i === today.results.length && ev.status === 'continue';
                return (
                  <div key={i} className={`pip ${r ?? ''} ${isNext ? 'next' : ''} ${i >= BASE_SET ? 'ext' : ''}`}>
                    <b>{r ?? (isNext ? '▶' : i + 1)}</b>
                    <span>{i >= BASE_SET ? '延長' : `${i + 1}戦目`}</span>
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
            <div className="row spread">
              <span className="small muted">{ev.phase === 'extension' ? '延長戦中：負けたら即終了' : `基本セット ${Math.min(today.results.length, BASE_SET)} / ${BASE_SET}`}</span>
              <button className="btn btn-ghost" disabled={today.results.length === 0} onClick={undo}>
                1つ戻す
              </button>
            </div>
          </div>
        </Panel>

        <WorkoutTimer />
      </div>

      {today.results.length > 0 && (
        <Panel title="試合ごとの振り返り" icon="pen" action={<span className="small muted">できたことにチェック・自動保存</span>}>
          <div className="stack">
            {today.results.map((r, i) => {
              const checked = today.checks?.[i] ?? [];
              return (
                <div key={i} className="note-row">
                  <div className={`pip ${r}`}>
                    <b>{r}</b>
                    <span>{i + 1}戦目</span>
                  </div>
                  <div className="stack-sm">
                    <div className="checklist" role="group" aria-label={`${i + 1}戦目のチェックリスト`}>
                      {CHECKLIST.map((c) => {
                        const on = checked.includes(c.id);
                        return (
                          <button key={c.id} className={`check ${on ? 'on' : ''}`} aria-pressed={on} title={c.hint} onClick={() => toggleCheck(i, c.id)}>
                            <span className="box">{on ? '✓' : ''}</span>
                            {c.text}
                          </button>
                        );
                      })}
                    </div>
                    <textarea
                      aria-label={`${i + 1}戦目の振り返り`}
                      placeholder="ひとことメモ（例：3:30にボットへ行けた／視界なしでドラゴンに触った）"
                      value={today.notes[i] ?? ''}
                      onChange={(e) => setNote(i, e.target.value)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      <Panel title="振り返りの傾向" icon="spark" action={<span className="small muted num">チェックした {stats.games} 試合から集計</span>}>
        {stats.games === 0 ? (
          <p className="small muted">試合後にチェックリストを付けると、苦手な習慣と「勝敗を分けている習慣」がここに出ます。</p>
        ) : (
          <div className="grid grid-2">
            <div>
              <h3 style={{ marginBottom: 10 }}>習慣ごとの達成率</h3>
              <div className="stack-sm">
                {stats.items.map((it) => (
                  <div key={it.id} className="habit-row" title={`勝ち試合 ${it.winRate ?? '—'}% / 負け試合 ${it.lossRate ?? '—'}%`}>
                    <span className="small">{it.text}</span>
                    <div className="bar">
                      <span style={{ width: `${it.rate}%` }} />
                    </div>
                    <span className="small num" style={{ textAlign: 'right' }}>
                      {it.rate}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="stack-sm">
              <h3>勝敗を分けている習慣</h3>
              {stats.keyHabits.length ? (
                stats.keyHabits.slice(0, 3).map((it) => (
                  <div key={it.id} className="explain" style={{ marginTop: 0 }}>
                    <strong>{it.text}</strong>
                    <div className="small muted num">
                      勝ち試合で {it.winRate}% ／ 負け試合で {it.lossRate}%（差 {it.gap}pt）
                    </div>
                  </div>
                ))
              ) : (
                <p className="small muted">勝ち試合と負け試合の両方をチェックすると表示されます。</p>
              )}
              <h3 style={{ marginTop: 6 }}>いちばん苦手な習慣</h3>
              <p className="small">
                <strong style={{ color: 'var(--gold-2)' }}>{stats.weakest[0].text}</strong>（達成率 {stats.weakest[0].rate}%）
              </p>
            </div>
          </div>
        )}
      </Panel>

      <div className="grid grid-2">
        <Panel title="「悟り」ノート" icon="flame" action={<span className="chip chip-gold num">今日 {todayInsights} / 9 行</span>}>
          <p className="small muted" style={{ marginBottom: 12 }}>
            著者はプロのリプレイから得た気づきを毎日9行ずつ言語化しました。ノート90ページでGM、200ページでチャレンジャー1000LP。
          </p>
          <div className="row" style={{ flexWrap: 'nowrap', marginBottom: 8 }}>
            <input
              type="text"
              placeholder="例：CCサポートなら、仕掛けを待ってカウンターガンク"
              value={insight}
              onChange={(e) => setInsight(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addInsight()}
            />
            <button className="btn btn-primary" onClick={addInsight}>
              追加
            </button>
          </div>
          {data.insights.length > 0 ? (
            <ul className="insight-list">
              {data.insights.slice(0, 60).map((n, i) => (
                <li key={i}>
                  <span>
                    <Icon name="spark" size={14} />
                  </span>
                  <span style={{ flex: 1 }}>{n.text}</span>
                  <span className="small muted num">{n.date.slice(5)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="small muted">まだ記録がありません。</p>
          )}
        </Panel>

        <Panel title="通算勝率の推移" icon="spark">
          <WinRateChart results={allResults} />
        </Panel>
      </div>
    </div>
  );
}
