import { useState } from 'react';
import type { Navigate } from '../App';
import { Icon, PageHeader, Panel, ProgressRing } from '../components/ui';
import { getSection, routes, routeScenarios, type JungleRoute } from '../content';
import { useStore } from '../store';

const GOAL_LABEL: Record<JungleRoute['goal'], string> = { bot: 'ボット狙い', mid: 'ミッド狙い', top: 'トップ狙い', flex: '状況対応' };
type GoalFilter = JungleRoute['goal'] | 'all';

function CampPath({ camps }: { camps: string[] }) {
  return (
    <div className="camp-path">
      {camps.map((c, i) => (
        <span key={i} className="camp-step">
          <span className={`camp ${c.startsWith('敵') ? 'enemy' : ''}`}>{c}</span>
          {i < camps.length - 1 && <span className="camp-arrow">→</span>}
        </span>
      ))}
    </div>
  );
}

export function RoutesPage({ navigate }: { navigate: Navigate }) {
  const { data } = useStore();
  const [goal, setGoal] = useState<GoalFilter>('all');
  const latest = new Map<string, boolean>();
  for (const a of [...data.answers].sort((x, y) => x.at - y.at)) latest.set(a.questionId, a.correct);
  const answered = routeScenarios.filter((q) => latest.has(q.id));
  const correct = answered.filter((q) => latest.get(q.id)).length;
  const pct = answered.length ? Math.round((correct / answered.length) * 100) : 0;
  const shown = routes.filter((r) => goal === 'all' || r.goal === goal);
  const practice = (ids: string[]) => navigate({ page: 'drill', ids, label: 'ルート練習' });

  return (
    <div className="stack">
      <PageHeader eyebrow="JUNGLE ROUTES" title="ジャングルルート練習">
        教科書の序盤ルート定石。「どこを狙うか」と「相手ジャングラーのスタート」からルートを選べるようにしましょう。
      </PageHeader>

      <Panel>
        <div className="row spread">
          <div className="row">
            <ProgressRing value={pct} size={52} label={`正答率 ${pct}%`} />
            <div>
              <div style={{ fontWeight: 700 }} className="num">
                {answered.length ? `正答率 ${pct}%` : '未挑戦'}
              </div>
              <div className="small muted">
                練習問題 {answered.length} / {routeScenarios.length} 問に回答（JG の点数に反映）
              </div>
            </div>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => practice(routeScenarios.map((q) => q.id))}>
            <Icon name="target" />
            練習問題に挑戦（{routeScenarios.length}問）
          </button>
        </div>
      </Panel>

      <div className="segmented" role="tablist" aria-label="狙うレーン">
        {(['all', 'bot', 'mid', 'top', 'flex'] as GoalFilter[]).map((g) => (
          <button key={g} role="tab" aria-selected={goal === g} className={goal === g ? 'on' : ''} onClick={() => setGoal(g)}>
            {g === 'all' ? 'すべて' : GOAL_LABEL[g]}
          </button>
        ))}
      </div>

      <div className="grid grid-2">
        {shown.map((r) => {
          const qs = routeScenarios.filter((q) => q.routeId === r.id);
          const ref = getSection(r.ref);
          return (
            <section key={r.id} className="panel route-card">
              <div className="row spread">
                <span className={`chip ${r.goal === 'bot' ? 'chip-gold' : r.goal === 'flex' ? '' : 'chip-ally'}`}>{GOAL_LABEL[r.goal]}</span>
                {r.level && <span className="small muted">{r.level}</span>}
              </div>
              <h2 style={{ margin: '10px 0 12px' }}>{r.name}</h2>
              <CampPath camps={r.camps} />
              <p className="small" style={{ color: 'var(--text-2)', margin: '12px 0' }}>
                {r.when}
              </p>
              <div className="row spread">
                {ref ? (
                  <button className="link small" onClick={() => navigate({ page: 'reader', sectionId: ref.id })}>
                    <Icon name="book" size={14} />
                    教科書で読む
                  </button>
                ) : (
                  <span />
                )}
                {qs.length > 0 && (
                  <button className="btn" onClick={() => practice(qs.map((q) => q.id))}>
                    このルートの問題（{qs.length}）
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
