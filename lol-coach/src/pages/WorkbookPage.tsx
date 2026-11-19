import { useState } from 'react';
import type { Navigate } from '../App';
import { getSection, workbookAnswers, workbookQuestions } from '../content';
import { useStore, type SelfRating } from '../store';

const RATING_LABEL: Record<SelfRating, string> = { good: '◎ できた', unsure: '△ あいまい', bad: '✕ できなかった' };

export function WorkbookPage({ navigate }: { navigate: Navigate }) {
  const { data, update } = useStore();
  const [currentId, setCurrentId] = useState(workbookQuestions[0]?.id);
  const [showAnswer, setShowAnswer] = useState(false);
  const books = [...new Set(workbookQuestions.map((q) => q.book))];
  const q = workbookQuestions.find((x) => x.id === currentId);
  const saved = currentId ? data.workbook[currentId] : undefined;
  const model = currentId ? workbookAnswers[currentId] : undefined;
  const done = Object.values(data.workbook).filter((w) => w.rating === 'good').length;

  const open = (id: string) => {
    setCurrentId(id);
    setShowAnswer(false);
  };
  const save = (patch: { text?: string; rating?: SelfRating }) =>
    update((d) => ({
      ...d,
      workbook: { ...d.workbook, [currentId]: { text: '', ...d.workbook[currentId], ...patch, updatedAt: Date.now() } },
    }));

  return (
    <div className="stack">
      <header className="page-head">
        <h1>ワークブック</h1>
        <p className="muted">
          教科書のワークブックを自分の言葉で解き、模範解答と比べて自己採点します。（「できた」{done} / {workbookQuestions.length}問）
        </p>
      </header>
      <div className="reader">
        <aside className="card toc" aria-label="設問一覧">
          {books.map((b) => (
            <div key={b} style={{ marginBottom: 12 }}>
              <div className="small" style={{ color: 'var(--gold-2)', fontWeight: 600, padding: '4px 8px' }}>
                {b}
              </div>
              {workbookQuestions
                .filter((x) => x.book === b)
                .map((x) => {
                  const r = data.workbook[x.id]?.rating;
                  return (
                    <button key={x.id} className={`toc-item ${x.id === currentId ? 'active' : ''}`} onClick={() => open(x.id)}>
                      {r ? RATING_LABEL[r].slice(0, 1) + ' ' : ''}
                      {x.title}
                    </button>
                  );
                })}
            </div>
          ))}
        </aside>

        {q && (
          <section className="card stack">
            <div>
              <div className="muted small">{q.part}</div>
              <h2 style={{ marginTop: 6 }}>{q.title}</h2>
              <div className="article-body">{q.body}</div>
            </div>
            <label className="field">
              あなたの回答（自動保存）
              <textarea value={saved?.text ?? ''} placeholder="まず自分の頭で考えて書いてみましょう" onChange={(e) => save({ text: e.target.value })} />
            </label>
            <div>
              <button className="btn btn-primary" onClick={() => setShowAnswer((v) => !v)}>
                {showAnswer ? '模範解答を隠す' : '模範解答を見る'}
              </button>
            </div>
            {showAnswer && (
              <div className="feedback">
                {model ? (
                  <>
                    <div className="article-body">{model.answer}</div>
                    <div className="row small" style={{ marginTop: 8 }}>
                      教科書：
                      {model.refs.map((r) => (
                        <button key={r} className="link" onClick={() => navigate({ page: 'reader', sectionId: r })}>
                          {getSection(r)?.title ?? r}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <span className="muted">この設問の模範解答はまだありません。</span>
                )}
              </div>
            )}
            <div className="row">
              <span className="muted small">自己採点：</span>
              {(Object.keys(RATING_LABEL) as SelfRating[]).map((r) => (
                <button key={r} className={`btn ${saved?.rating === r ? 'btn-primary' : ''}`} onClick={() => save({ rating: r })}>
                  {RATING_LABEL[r]}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
