import { useMemo, useState } from 'react';
import type { Navigate } from '../App';
import { getSection, quiz } from '../content';
import { buildReviewQueue, computeSubjectScores, SUBJECTS, SUBJECT_LABEL, type Subject } from '../core/progress';
import { useStore } from '../store';

type Filter = Subject | 'all' | 'review';

export function DrillPage({ initialSubject, navigate }: { initialSubject?: Subject | 'review'; navigate: Navigate }) {
  const { data, update } = useStore();
  const [filter, setFilter] = useState<Filter>(initialSubject ?? 'all');
  // 出題順はフィルタ選択時点の履歴で固定する（回答のたびに並び替わらないように）
  const queue = useMemo(() => {
    const pool = filter === 'all' || filter === 'review' ? quiz : quiz.filter((q) => q.subject === filter);
    const ordered = buildReviewQueue(
      pool.map((q) => q.id),
      data.answers,
    );
    if (filter !== 'review') return ordered;
    const latest = new Map<string, boolean>();
    for (const a of [...data.answers].sort((x, y) => x.at - y.at)) latest.set(a.questionId, a.correct);
    return ordered.filter((id) => latest.get(id) === false);
  }, [filter]);
  const [pos, setPos] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [sessionScore, setSessionScore] = useState({ correct: 0, answered: 0 });
  const scores = computeSubjectScores(quiz, data.answers);

  const q = quiz.find((x) => x.id === queue[pos]);
  const ref = q ? getSection(q.ref) : undefined;

  const choose = (i: number) => {
    if (!q || picked !== null) return;
    setPicked(i);
    const correct = i === q.answer;
    setSessionScore((s) => ({ correct: s.correct + (correct ? 1 : 0), answered: s.answered + 1 }));
    update((d) => ({ ...d, answers: [...d.answers, { questionId: q.id, correct, at: Date.now() }] }));
  };
  const next = () => {
    setPicked(null);
    setPos((p) => p + 1);
  };
  const changeFilter = (f: Filter) => {
    setFilter(f);
    setPos(0);
    setPicked(null);
    setSessionScore({ correct: 0, answered: 0 });
  };

  return (
    <div className="stack">
      <header className="page-head">
        <h1>判断力ドリル</h1>
        <p className="muted">教科書のルールと分類から出題します。間違えた問題は優先して再出題されます。</p>
      </header>

      <div className="row">
        <button className={`btn ${filter === 'all' ? 'btn-primary' : ''}`} onClick={() => changeFilter('all')}>
          全科目
        </button>
        {SUBJECTS.map((s) => (
          <button key={s} className={`btn ${filter === s ? 'btn-primary' : ''}`} onClick={() => changeFilter(s)}>
            {SUBJECT_LABEL[s]} <span className="small">{scores[s].score === null ? '' : `${scores[s].score}点`}</span>
          </button>
        ))}
        <button className={`btn ${filter === 'review' ? 'btn-primary' : ''}`} onClick={() => changeFilter('review')}>
          復習
        </button>
      </div>

      {!q ? (
        <section className="card">
          <h2>{queue.length === 0 ? (filter === 'review' ? '復習する問題はありません 🎉' : '問題がありません') : 'このセットは終了です'}</h2>
          {sessionScore.answered > 0 && (
            <p>
              今回の成績: {sessionScore.answered}問中 {sessionScore.correct}問正解
            </p>
          )}
          <div className="row">
            <button className="btn btn-primary" onClick={() => changeFilter(filter)}>
              もう一度
            </button>
            <button className="btn" onClick={() => navigate({ page: 'home' })}>
              ホームへ
            </button>
          </div>
        </section>
      ) : (
        <section className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="chip chip-gold">{SUBJECT_LABEL[q.subject]}</span>
            <span className="muted small">
              {pos + 1} / {queue.length}　正解 {sessionScore.correct}/{sessionScore.answered}
            </span>
          </div>
          <h2 style={{ marginTop: 14 }}>{q.question}</h2>
          {q.choices.map((c, i) => (
            <button
              key={i}
              className={`choice ${picked !== null && i === q.answer ? 'correct' : ''} ${picked === i && i !== q.answer ? 'wrong' : ''}`}
              disabled={picked !== null}
              onClick={() => choose(i)}
            >
              {String.fromCharCode(65 + i)}. {c}
            </button>
          ))}
          {picked !== null && (
            <div className="stack" style={{ marginTop: 8 }}>
              <div className="feedback">
                <strong>{picked === q.answer ? '正解！' : `不正解… 正解は ${String.fromCharCode(65 + q.answer)}`}</strong>
                <div>{q.explanation}</div>
                {ref && (
                  <button className="link small" onClick={() => navigate({ page: 'reader', sectionId: ref.id })}>
                    教科書で確認：{ref.title}
                  </button>
                )}
              </div>
              <div>
                <button className="btn btn-primary" onClick={next}>
                  次の問題 →
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
