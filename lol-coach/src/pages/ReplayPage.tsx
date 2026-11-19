import { useState } from 'react';
import { Icon, PageHeader, Panel } from '../components/ui';
import { todayKey, useStore, type ReplayNote } from '../store';

const ROLES = ['TOP', 'JG', 'MID', 'ADC', 'SUP'];
const DAILY_GOAL = 9;
const empty = (): Omit<ReplayNote, 'id' | 'date'> => ({ player: '', champion: '', role: 'JG', time: '', situation: '', action: '', why: '', insight: '' });

export function ReplayPage() {
  const { data, update } = useStore();
  const [form, setForm] = useState(empty);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [sent, setSent] = useState<string | null>(null);
  const date = todayKey();
  const todayCount = data.replays.filter((r) => r.date === date).length;
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const canSave = form.action.trim() !== '' || form.insight.trim() !== '';

  const save = () => {
    if (!canSave) return;
    const note: ReplayNote = { ...form, id: `rp-${Date.now()}`, date };
    update((d) => ({ ...d, replays: [note, ...d.replays] }));
    setForm((f) => ({ ...empty(), player: f.player, role: f.role }));
  };
  const toInsight = (n: ReplayNote) => {
    const text = n.insight.trim() || n.action.trim();
    if (!text) return;
    update((d) => ({ ...d, insights: [{ date, text: `${text}（${n.player || 'プロ'}${n.champion ? `・${n.champion}` : ''}）` }, ...d.insights] }));
    setSent(n.id);
  };
  const remove = (id: string) => {
    if (window.confirm('このノートを削除しますか？')) update((d) => ({ ...d, replays: d.replays.filter((r) => r.id !== id) }));
  };

  const q = query.trim().toLowerCase();
  const list = data.replays.filter(
    (r) => (roleFilter === 'all' || r.role === roleFilter) && (!q || [r.player, r.champion, r.situation, r.action, r.why, r.insight].join(' ').toLowerCase().includes(q)),
  );

  return (
    <div className="stack">
      <PageHeader eyebrow="REPLAY ANALYSIS" title="リプレイ分析ノート">
        著者はプレイ前にプロのリプレイを9戦観戦し、動きの意味を考えて言語化しました。「なぜその動きなのか」を書くことが、自分だけの正解ノートになります。
      </PageHeader>

      <div className="grid split" style={{ alignItems: 'start' }}>
        <Panel title="新しいメモ" icon="play" action={<span className={`chip ${todayCount >= DAILY_GOAL ? 'chip-gold' : ''} num`}>今日 {todayCount} / {DAILY_GOAL}</span>}>
          <div className="stack-sm">
            <div className="grid grid-3" style={{ gap: 10 }}>
              <label className="field">
                選手
                <input type="text" value={form.player} onChange={set('player')} placeholder="例：Faker" />
              </label>
              <label className="field">
                チャンピオン
                <input type="text" value={form.champion} onChange={set('champion')} placeholder="例：アーリ" />
              </label>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <label className="field">
                  ロール
                  <select value={form.role} onChange={set('role')}>
                    {ROLES.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  時刻
                  <input type="text" value={form.time} onChange={set('time')} placeholder="03:30" />
                </label>
              </div>
            </div>
            <label className="field">
              状況（マップ・ウェーブ・視界・スペル）
              <textarea style={{ minHeight: 60 }} value={form.situation} onChange={set('situation')} placeholder="例：ボットがプッシュされ、敵ジャングラーはトップ側で見えている" />
            </label>
            <label className="field">
              プロの動き
              <textarea style={{ minHeight: 60 }} value={form.action} onChange={set('action')} placeholder="例：3キャンプ後にリコールせずボットへ向かった" />
            </label>
            <label className="field">
              なぜ？（教科書の言葉で）
              <textarea style={{ minHeight: 60 }} value={form.why} onChange={set('why')} placeholder="例：ボットがCCサポート＋レーン戦が強いADCで最重要。敵ジャングラーが逆サイドにいる" />
            </label>
            <label className="field">
              自分への気づき（1行）
              <input type="text" value={form.insight} onChange={set('insight')} placeholder="例：敵JGが逆サイドで見えたら、最重要レーンへ即ガンク" />
            </label>
            <div className="row">
              <button className="btn btn-primary" disabled={!canSave} onClick={save}>
                メモを保存
              </button>
              <span className="small muted">「プロの動き」か「気づき」を書くと保存できます</span>
            </div>
          </div>
        </Panel>

        <Panel title={`ノート（${data.replays.length}件）`} icon="book">
          <div className="input-icon" style={{ marginBottom: 10 }}>
            <Icon name="search" size={16} />
            <input type="search" placeholder="選手・チャンピオン・内容で検索" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="segmented" style={{ marginBottom: 12 }}>
            {['all', ...ROLES].map((r) => (
              <button key={r} className={roleFilter === r ? 'on' : ''} onClick={() => setRoleFilter(r)}>
                {r === 'all' ? 'すべて' : r}
              </button>
            ))}
          </div>
          {list.length === 0 ? (
            <p className="small muted">まだメモがありません。プロの試合を1つ選んで、気になった動きを1つ書いてみましょう。</p>
          ) : (
            <div className="stack-sm replay-list">
              {list.map((n) => (
                <article key={n.id} className="replay-item">
                  <div className="row spread">
                    <div className="row" style={{ gap: 6 }}>
                      <span className="chip chip-gold">{n.role}</span>
                      <strong>{n.player || '（選手未記入）'}</strong>
                      {n.champion && <span className="small muted">{n.champion}</span>}
                      {n.time && <span className="chip num">{n.time}</span>}
                    </div>
                    <span className="small muted num">{n.date}</span>
                  </div>
                  {n.situation && <p className="small muted">状況：{n.situation}</p>}
                  {n.action && <p className="small">動き：{n.action}</p>}
                  {n.why && <p className="small" style={{ color: 'var(--text-2)' }}>理由：{n.why}</p>}
                  {n.insight && (
                    <p className="small" style={{ color: 'var(--gold-2)' }}>
                      <Icon name="spark" size={12} /> {n.insight}
                    </p>
                  )}
                  <div className="row" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost small" onClick={() => toInsight(n)} disabled={sent === n.id}>
                      {sent === n.id ? '悟りノートに追加済み' : '悟りノートへ送る'}
                    </button>
                    <button className="btn btn-ghost small" onClick={() => remove(n.id)}>
                      削除
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
