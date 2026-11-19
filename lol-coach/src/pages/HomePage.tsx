import type { Navigate } from '../App';
import { Icon, Panel, ProgressRing, type IconName } from '../components/ui';
import { quiz, sections, workbookQuestions } from '../content';
import { computeSubjectScores, recommendSubject, SUBJECTS, SUBJECT_LABEL } from '../core/progress';
import { useStore } from '../store';

function StatTile({ icon, label, value, sub }: { icon: IconName; label: string; value: string; sub: string }) {
  return (
    <div className="panel stat-tile">
      <div className="stat-icon">
        <Icon name={icon} />
      </div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value num">{value}</div>
        <div className="small muted">{sub}</div>
      </div>
    </div>
  );
}

export function HomePage({ navigate }: { navigate: Navigate }) {
  const { data } = useStore();
  const scores = computeSubjectScores(quiz, data.answers);
  const rec = recommendSubject(scores);
  const total = SUBJECTS.reduce((sum, s) => sum + (scores[s].score ?? 0), 0);
  const allGames = data.sessions.flatMap((s) => s.results);
  const wins = allGames.filter((r) => r === 'W').length;
  const winRate = allGames.length ? Math.round((wins / allGames.length) * 100) : null;
  const readPct = Math.round((data.read.length / sections.length) * 100);
  const answered = new Set(data.answers.map((a) => a.questionId)).size;
  const wbDone = Object.values(data.workbook).filter((w) => w.rating === 'good').length;

  return (
    <div className="stack">
      <section className="hero">
        <div className="stack-sm" style={{ position: 'relative', zIndex: 1 }}>
          <div className="eyebrow">YOUR SOLO QUEUE EXAM</div>
          <h1>ソロランクは「7科目の試験」</h1>
          <p className="lead">自分のレーンだけ上手くても、0点に近い科目がティアを止めてしまいます。いちばん低い科目から底上げしていきましょう。</p>
          <div className="row" style={{ marginTop: 10 }}>
            {rec && (
              <button className="btn btn-primary btn-lg" onClick={() => navigate({ page: 'drill', subject: rec })}>
                <Icon name="target" />
                {SUBJECT_LABEL[rec]} のドリルを解く
              </button>
            )}
            <button className="btn btn-lg" onClick={() => navigate({ page: 'session' })}>
              <Icon name="swords" />
              今日の3戦を始める
            </button>
          </div>
        </div>
        <div className="hero-score">
          <div className="small muted">合計点</div>
          <div className="big num">{total}</div>
          <div className="small muted">/ 700</div>
        </div>
      </section>

      <div className="grid grid-4">
        <StatTile
          icon="swords"
          label="通算勝率"
          value={winRate === null ? '—' : `${winRate}%`}
          sub={allGames.length ? `${allGames.length}戦 ${wins}勝` : '55%で上位20%'}
        />
        <StatTile icon="target" label="ドリル" value={`${answered}/${quiz.length}`} sub="解いた問題" />
        <StatTile icon="pen" label="ワークブック" value={`${wbDone}/${workbookQuestions.length}`} sub="「できた」設問" />
        <StatTile icon="book" label="教科書の既読" value={`${readPct}%`} sub={`${data.read.length} / ${sections.length} 章`} />
      </div>

      <div className="grid split">
        <Panel
          title="科目別の点数"
          icon="spark"
          action={<span className="small muted">各問題の最新回答から計算</span>}
        >
          <div>
            {SUBJECTS.map((s) => {
              const sc = scores[s];
              return (
                <button
                  className={`subject-row ${s === rec ? 'rec' : ''}`}
                  key={s}
                  onClick={() => navigate({ page: 'drill', subject: s })}
                  title={`${SUBJECT_LABEL[s]}：${sc.answered}/${sc.total}問 回答。クリックでドリルへ`}
                >
                  <strong>{SUBJECT_LABEL[s]}</strong>
                  <div className="bar" role="progressbar" aria-valuenow={sc.score ?? 0} aria-valuemin={0} aria-valuemax={100}>
                    <span style={{ width: `${sc.score ?? 0}%` }} />
                  </div>
                  <span className="val num">
                    {sc.score === null ? '未受験' : `${sc.score}点`}
                    {s === rec && <span style={{ color: 'var(--gold)' }}> ★</span>}
                  </span>
                </button>
              );
            })}
          </div>
          {rec && (
            <p className="small muted" style={{ marginTop: 12 }}>
              ★ 次に学ぶ科目：<strong style={{ color: 'var(--gold-2)' }}>{SUBJECT_LABEL[rec]}</strong>
              {scores[rec].score === null ? '（まだ一度も解いていません）' : `（現在 ${scores[rec].score}点）`}
            </p>
          )}
        </Panel>

        <div className="stack">
          <Panel title="おすすめの学習ルート" icon="flame">
            <ol className="step-list">
              <li>教科書の「各レーンの重要度」を読む</li>
              <li>ガンク判定で、構図ごとの優先順位を体感する</li>
              <li>判断力ドリルで7科目の点数を測る</li>
              <li>ワークブックで自分の言葉で説明してみる</li>
              <li>ランク戦は「3戦セット」のルールで</li>
            </ol>
          </Panel>
          <div className="grid grid-2">
            <button className="action-card" onClick={() => navigate({ page: 'drill', subject: 'review' })}>
              <div className="stat-icon">
                <Icon name="target" />
              </div>
              <strong>間違えた問題を復習</strong>
              <span className="small muted">誤答だけを集中して</span>
            </button>
            <button className="action-card" onClick={() => navigate({ page: 'reader' })}>
              <div className="row spread">
                <div className="stat-icon">
                  <Icon name="book" />
                </div>
                <ProgressRing value={readPct} size={40} label={`既読 ${readPct}%`} />
              </div>
              <strong>教科書の続きを読む</strong>
              <span className="small muted">全{sections.length}章</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
