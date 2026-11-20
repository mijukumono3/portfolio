import { useState } from 'react';
import type { Navigate } from '../App';
import { Icon, PageHeader, Panel, ProgressRing } from '../components/ui';
import { getSection, workbookAnswers, workbookQuestions } from '../content';
import { useStore, type SelfRating } from '../store';

const RATING: { key: SelfRating; label: string; mark: string }[] = [
  { key: 'good', label: 'できた', mark: '◎' },
  { key: 'unsure', label: 'あいまい', mark: '△' },
  { key: 'bad', label: 'できなかった', mark: '✕' },
];
const MARK: Record<SelfRating, string> = { good: '◎', unsure: '△', bad: '✕' };

export function WorkbookPage({ navigate }: { navigate: Navigate }) {
  const { data, update } = useStore();
  const [currentId, setCurrentId] = useState(() => workbookQuestions.find((q) => data.workbook[q.id]?.rating !== 'good')?.id ?? workbookQuestions[0].id);
  const [showAnswer, setShowAnswer] = useState(false);
  const books = [...new Set(workbookQuestions.map((q) => q.book))];
  const index = workbookQuestions.findIndex((x) => x.id === currentId);
  const q = workbookQuestions[index];
  const saved = data.workbook[currentId];
  const model = workbookAnswers[currentId];
  const done = Object.values(data.workbook).filter((w) => w.rating === 'good').length;
  const pct = Math.round((done / workbookQuestions.length) * 100);

  const open = (id: string) => {
    setCurrentId(id);
    setShowAnswer(false);
    document.querySelector('.main')?.scrollTo({ top: 0 });
  };
  const save = (patch: { text?: string; rating?: SelfRating }) =>
    update((d) => ({
      ...d,
      workbook: { ...d.workbook, [currentId]: { ...(d.workbook[currentId] ?? { text: '' }), ...patch, updatedAt: Date.now() } },
    }));

  return (
    <div className="stack">
      <PageHeader eyebrow="WORKBOOK" title="ワークブック">
        「この状況、あなたならどう動く？」をまず自分の言葉で書き、模範解答と比べて自己採点しましょう。
      </PageHeader>
      <div className="two-pane">
        <aside className="panel side-list" aria-label="設問一覧">
          <div className="row" style={{ marginBottom: 10 }}>
            <ProgressRing value={pct} size={44} label={`できた ${pct}%`} />
            <div>
              <div style={{ fontWeight: 700 }} className="num">
                {done} / {workbookQuestions.length}
              </div>
              <div className="small muted">「できた」設問</div>
            </div>
          </div>
          <div className="side-scroll">
            {books.map((b) => (
              <div key={b} style={{ marginBottom: 8 }}>
                <div className="list-group" style={{ cursor: 'default' }}>
                  {b}
                </div>
                {workbookQuestions
                  .filter((x) => x.book === b)
                  .map((x) => {
                    const r = data.workbook[x.id]?.rating;
                    return (
                      <button key={x.id} className={`list-item ${x.id === currentId ? 'active' : ''}`} onClick={() => open(x.id)}>
                        <span className="state" style={{ color: r === 'bad' ? 'var(--bad)' : r === 'unsure' ? 'var(--gold)' : 'var(--good)' }}>
                          {r ? MARK[r] : data.workbook[x.id]?.text ? '·' : ''}
                        </span>
                        <span>{x.title}</span>
                      </button>
                    );
                  })}
              </div>
            ))}
          </div>
        </aside>

        {q && (
          <div className="stack">
            <Panel>
              <div className="stack">
                <div>
                  <div className="eyebrow">{q.part}</div>
                  <h2 style={{ fontSize: 20 }}>{q.title}</h2>
                </div>
                <div className="q-body">{q.body}</div>
                <label className="field">
                  <span className="row spread">
                    あなたの回答
                    <span className="saved-hint">{saved?.updatedAt ? `自動保存済み ${new Date(saved.updatedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}` : '入力すると自動保存'}</span>
                  </span>
                  <textarea value={saved?.text ?? ''} placeholder="まず自分の頭で考えて書いてみましょう" onChange={(e) => save({ text: e.target.value })} />
                </label>
                <div className="row">
                  <button className="btn btn-primary" onClick={() => setShowAnswer((v) => !v)}>
                    {showAnswer ? '模範解答を隠す' : '模範解答を見る'}
                  </button>
                  {!saved?.text && !showAnswer && <span className="small muted">書いてから見るのがおすすめ</span>}
                </div>
                {showAnswer && (
                  <div className="explain">
                    {model ? (
                      <>
                        <div className="verdict-title" style={{ color: 'var(--gold-2)' }}>
                          模範解答
                        </div>
                        <div style={{ color: 'var(--text-2)', lineHeight: 1.9 }}>{model.answer}</div>
                        <div className="row small" style={{ marginTop: 12 }}>
                          <Icon name="book" size={14} />
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
              </div>
            </Panel>
            <Panel title="自己採点">
              <div className="rating">
                {RATING.map((r) => (
                  <button key={r.key} className={`${r.key} ${saved?.rating === r.key ? 'on' : ''}`} aria-pressed={saved?.rating === r.key} onClick={() => save({ rating: r.key })}>
                    {r.mark} {r.label}
                  </button>
                ))}
              </div>
              <div className="row spread" style={{ marginTop: 16 }}>
                <button className="btn btn-ghost" disabled={index <= 0} onClick={() => open(workbookQuestions[index - 1].id)}>
                  ← 前の設問
                </button>
                <button className="btn" disabled={index >= workbookQuestions.length - 1} onClick={() => open(workbookQuestions[index + 1].id)}>
                  次の設問 <Icon name="arrow" size={16} />
                </button>
              </div>
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}
