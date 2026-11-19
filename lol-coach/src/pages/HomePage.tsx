import type { Navigate } from '../App';
import { quiz, sections } from '../content';
import { computeSubjectScores, recommendSubject, SUBJECTS, SUBJECT_LABEL } from '../core/progress';
import { evaluateSession } from '../core/session';
import { todayKey, useStore } from '../store';

export function HomePage({ navigate }: { navigate: Navigate }) {
  const { data } = useStore();
  const scores = computeSubjectScores(quiz, data.answers);
  const rec = recommendSubject(scores);
  const total = SUBJECTS.reduce((sum, s) => sum + (scores[s].score ?? 0), 0);
  const today = data.sessions.find((s) => s.date === todayKey());
  const todayEval = evaluateSession(today?.results ?? []);
  const allGames = data.sessions.flatMap((s) => s.results);
  const winRate = allGames.length ? Math.round((allGames.filter((r) => r === 'W').length / allGames.length) * 100) : null;
  const readPct = Math.round((data.read.length / sections.length) * 100);

  return (
    <div className="stack">
      <header className="page-head">
        <h1>ホーム</h1>
        <p className="muted">ソロランクは「7科目の試験」。0点に近い科目こそが、あなたのティアを止めています。</p>
      </header>

      <div className="grid grid-3">
        <div className="card">
          <div className="muted small">7科目の合計点</div>
          <div className="stat">
            {total}
            <span className="muted small"> / 700</span>
          </div>
        </div>
        <div className="card">
          <div className="muted small">ランク戦の通算勝率</div>
          <div className="stat">{winRate === null ? '—' : `${winRate}%`}</div>
          <div className="muted small">{allGames.length}戦 ・ 55%で上位20%、60%で上位5%</div>
        </div>
        <div className="card">
          <div className="muted small">教科書の既読</div>
          <div className="stat">{readPct}%</div>
          <div className="muted small">
            {data.read.length} / {sections.length} 章
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <section className="card">
          <h2>科目別の点数</h2>
          <div className="subject-list">
            {SUBJECTS.map((s) => {
              const sc = scores[s];
              return (
                <div className="subject-row" key={s}>
                  <strong>{SUBJECT_LABEL[s]}</strong>
                  <div className={`bar ${sc.score !== null && sc.score < 50 ? 'low' : ''}`} title={`${sc.answered}/${sc.total}問 回答`}>
                    <span style={{ width: `${sc.score ?? 0}%` }} />
                  </div>
                  <span className="small">{sc.score === null ? '未受験' : `${sc.score}点`}</span>
                </div>
              );
            })}
          </div>
          <p className="muted small">点数は判断力ドリルの各問題の最新回答から計算します。</p>
        </section>

        <div className="stack">
          <section className="card">
            <h2>次に学ぶ科目</h2>
            {rec ? (
              <>
                <p>
                  <span className="chip chip-gold">{SUBJECT_LABEL[rec]}</span>{' '}
                  {scores[rec].score === null ? 'まだ一度も解いていない科目です。' : `いま一番低い科目（${scores[rec].score}点）です。`}
                </p>
                <div className="row">
                  <button className="btn btn-primary" onClick={() => navigate({ page: 'drill', subject: rec })}>
                    {SUBJECT_LABEL[rec]} のドリルを解く
                  </button>
                  <button className="btn" onClick={() => navigate({ page: 'drill', subject: 'review' })}>
                    間違えた問題を復習
                  </button>
                </div>
              </>
            ) : (
              <p className="muted">問題データがありません。</p>
            )}
          </section>

          <section className="card">
            <h2>今日の3戦セット</h2>
            <p>
              {today?.results.length ? `${today.results.length}戦 ${todayEval.wins}勝${todayEval.losses}敗 — ` : 'まだ始めていません — '}
              <span className={todayEval.status === 'stop' ? 'muted' : ''}>{todayEval.status === 'stop' ? '本日は終了' : '続行可能'}</span>
            </p>
            <button className="btn" onClick={() => navigate({ page: 'session' })}>
              セッションを開く
            </button>
          </section>

          <section className="card">
            <h2>はじめての方へ</h2>
            <ol className="small" style={{ margin: 0, paddingLeft: 20 }}>
              <li>教科書の「各レーンの重要度」を読む</li>
              <li>ガンク判定で、味方・敵の構図から優先順位を確かめる</li>
              <li>判断力ドリルで7科目の点数を測る</li>
              <li>ランク戦は「3戦セット」のルールで</li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
