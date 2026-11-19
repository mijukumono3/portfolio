import { useEffect, useMemo, useState } from 'react';
import type { Navigate } from '../App';
import { Icon, PageHeader } from '../components/ui';
import { getSection, quiz } from '../content';
import { buildReviewQueue, computeSubjectScores, SUBJECTS, SUBJECT_LABEL, type Subject } from '../core/progress';
import { useStore } from '../store';

type Filter = Subject | 'all' | 'review';

export function DrillPage({ initialSubject, navigate }: { initialSubject?: Subject | 'review'; navigate: Navigate }) {
  const { data, update } = useStore();
  const [filter, setFilter] = useState<Filter>(initialSubject ?? 'all');
  const [round, setRound] = useState(0);
  // 出題順はセット開始時点の履歴で固定する（回答のたびに並び替わらないように）
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
  }, [filter, round]); // eslint-disable-line react-hooks/exhaustive-deps
  const [pos, setPos] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [tally, setTally] = useState({ correct: 0, answered: 0 });
  const scores = computeSubjectScores(quiz, data.answers);
  const wrongCount = useMemo(() => {
    const latest = new Map<string, boolean>();
    for (const a of [...data.answers].sort((x, y) => x.at - y.at)) latest.set(a.questionId, a.correct);
    return [...latest.values()].filter((v) => !v).length;
  }, [data.answers]);

  const q = quiz.find((x) => x.id === queue[pos]);
  const ref = q ? getSection(q.ref) : undefined;

  const choose = (i: number) => {
    if (!q || picked !== null) return;
    setPicked(i);
    const correct = i === q.answer;
    setTally((s) => ({ correct: s.correct + (correct ? 1 : 0), answered: s.answered + 1 }));
    update((d) => ({ ...d, answers: [...d.answers, { questionId: q.id, correct, at: Date.now() }] }));
  };
  const next = () => {
    setPicked(null);
    setPos((p) => p + 1);
  };
  const restart = (f: Filter) => {
    setFilter(f);
    setRound((r) => r + 1);
    setPos(0);
    setPicked(null);
    setTally({ correct: 0, answered: 0 });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      if (picked === null && ['1', '2', '3', '4'].includes(e.key)) choose(Number(e.key) - 1);
      else if (picked !== null && e.key === 'Enter') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const filters: { key: Filter; label: string; score?: number | null }[] = [
    { key: 'all', label: '全科目' },
    ...SUBJECTS.map((s) => ({ key: s as Filter, label: SUBJECT_LABEL[s], score: scores[s].score })),
    { key: 'review', label: `復習 ${wrongCount}` },
  ];

  return (
    <div className="stack">
      <PageHeader eyebrow="DECISION DRILL" title="判断力ドリル">
        教科書のルールと分類から出題。間違えた問題は優先して再出題されます。キーボードの <span className="kbd">1</span>〜<span className="kbd">4</span> で回答、
        <span className="kbd">Enter</span> で次へ。
      </PageHeader>

      <div className="segmented" role="tablist" aria-label="科目">
        {filters.map((f) => (
          <button key={f.key} role="tab" aria-selected={filter === f.key} className={filter === f.key ? 'on' : ''} onClick={() => restart(f.key)}>
            {f.label}
            {f.score !== undefined && f.score !== null && <span className="score num">{f.score}</span>}
          </button>
        ))}
      </div>

      {!q ? (
        <section className="panel quiz-card empty">
          <div className="big-icon">
            <Icon name={queue.length === 0 && filter === 'review' ? 'check' : 'flame'} size={28} />
          </div>
          <h2 style={{ fontSize: 20 }}>
            {queue.length === 0 ? (filter === 'review' ? '復習する問題はありません' : '問題がありません') : 'セット完了！'}
          </h2>
          {tally.answered > 0 && (
            <p className="muted" style={{ margin: '8px 0 18px' }}>
              {tally.answered}問中 <strong style={{ color: 'var(--gold-2)' }}>{tally.correct}問</strong> 正解（{Math.round((tally.correct / tally.answered) * 100)}%）
            </p>
          )}
          <div className="row" style={{ justifyContent: 'center', marginTop: 12 }}>
            <button className="btn btn-primary" onClick={() => restart(filter)}>
              もう一度
            </button>
            {wrongCount > 0 && filter !== 'review' && (
              <button className="btn" onClick={() => restart('review')}>
                間違えた問題を復習
              </button>
            )}
            <button className="btn btn-ghost" onClick={() => navigate({ page: 'home' })}>
              ホームへ
            </button>
          </div>
        </section>
      ) : (
        <section className="panel quiz-card">
          <div className="progress-line" aria-hidden>
            <span style={{ width: `${(pos / queue.length) * 100}%` }} />
          </div>
          <div className="row spread">
            <span className="chip chip-gold">{SUBJECT_LABEL[q.subject]}</span>
            <span className="small muted num">
              {pos + 1} / {queue.length}　・　正解 {tally.correct}/{tally.answered}
            </span>
          </div>
          <p className="question">{q.question}</p>
          {q.choices.map((c, i) => {
            const state = picked === null ? '' : i === q.answer ? 'correct' : picked === i ? 'wrong' : 'dim';
            return (
              <button key={i} className={`choice ${state}`} disabled={picked !== null} onClick={() => choose(i)}>
                <span className="key">{state === 'correct' ? '✓' : state === 'wrong' ? '✕' : i + 1}</span>
                <span>{c}</span>
              </button>
            );
          })}
          {picked !== null && (
            <div className="explain" aria-live="polite">
              <div className={`verdict-title ${picked === q.answer ? 'ok' : 'ng'}`}>{picked === q.answer ? '正解！' : `不正解 — 正解は ${q.answer + 1}`}</div>
              <div style={{ color: 'var(--text-2)' }}>{q.explanation}</div>
              <div className="row spread" style={{ marginTop: 14 }}>
                {ref ? (
                  <button className="link small" onClick={() => navigate({ page: 'reader', sectionId: ref.id })}>
                    <Icon name="book" size={14} />
                    教科書で確認：{ref.title}
                  </button>
                ) : (
                  <span />
                )}
                <button className="btn btn-primary" onClick={next}>
                  次の問題 <Icon name="arrow" size={16} />
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
