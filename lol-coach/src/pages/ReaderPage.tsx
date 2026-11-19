import { useMemo, useState } from 'react';
import { sections } from '../content';
import { searchSections } from '../core/search';
import { useStore } from '../store';

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return <>{parts.map((p, i) => (p.toLowerCase() === q.toLowerCase() ? <mark key={i}>{p}</mark> : p))}</>;
}

export function ReaderPage({ initialSectionId }: { initialSectionId?: string }) {
  const { data, update } = useStore();
  const [currentId, setCurrentId] = useState(initialSectionId ?? sections[0]?.id);
  const [query, setQuery] = useState('');
  const [onlyBookmarks, setOnlyBookmarks] = useState(false);
  const hits = useMemo(() => searchSections(sections, query), [query]);
  const index = sections.findIndex((s) => s.id === currentId);
  const current = sections[index];
  const isRead = data.read.includes(currentId);
  const isBookmarked = data.bookmarks.includes(currentId);

  const open = (id: string) => {
    setCurrentId(id);
    document.querySelector('.main')?.scrollTo(0, 0);
  };
  const toggle = (key: 'read' | 'bookmarks') =>
    update((d) => ({ ...d, [key]: d[key].includes(currentId) ? d[key].filter((x) => x !== currentId) : [...d[key], currentId] }));
  const markReadAndNext = () => {
    if (!isRead) update((d) => ({ ...d, read: [...d.read, currentId] }));
    const next = sections[index + 1];
    if (next) open(next.id);
  };

  const tocItems = onlyBookmarks ? sections.filter((s) => data.bookmarks.includes(s.id)) : sections;

  return (
    <div className="reader">
      <aside className="card toc" aria-label="目次">
        <input className="search" placeholder="教科書を検索（例：ヴォイドグラブ）" value={query} onChange={(e) => setQuery(e.target.value)} />
        <label className="row small muted" style={{ marginBottom: 8 }}>
          <input type="checkbox" checked={onlyBookmarks} onChange={(e) => setOnlyBookmarks(e.target.checked)} /> しおりのみ表示
        </label>
        {query.trim() ? (
          <>
            <div className="muted small">{hits.length}件の章がヒット</div>
            {hits.map((h) => (
              <button key={h.id} className={`toc-item ${h.id === currentId ? 'active' : ''}`} onClick={() => open(h.id)}>
                <strong>{h.title}</strong> <span className="chip">{h.count}</span>
                <div className="muted">
                  <Highlight text={h.snippet} query={query} />
                </div>
              </button>
            ))}
          </>
        ) : (
          tocItems.map((s) => (
            <button
              key={s.id}
              className={`toc-item ${s.id === currentId ? 'active' : ''} ${data.read.includes(s.id) ? 'read' : ''}`}
              style={{ paddingLeft: 8 + (s.level - 1) * 14, fontWeight: s.level === 1 ? 600 : 400 }}
              onClick={() => open(s.id)}
            >
              {data.bookmarks.includes(s.id) ? '🔖 ' : ''}
              {s.title}
            </button>
          ))
        )}
      </aside>

      {current && (
        <article className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="muted small">
              {index + 1} / {sections.length}
            </span>
            <div className="row">
              <button className="btn" onClick={() => toggle('bookmarks')}>
                {isBookmarked ? '🔖 しおりを外す' : 'しおりを挟む'}
              </button>
              <button className="btn" onClick={() => toggle('read')}>
                {isRead ? '✓ 既読' : '未読'}
              </button>
            </div>
          </div>
          <h1 style={{ margin: '12px 0 16px' }}>{current.title}</h1>
          <div className="article-body">
            {current.body ? <Highlight text={current.body} query={query} /> : <span className="muted">（この見出しの本文は次の章に続きます）</span>}
          </div>
          <div className="row" style={{ justifyContent: 'space-between', marginTop: 28 }}>
            <button className="btn" disabled={index <= 0} onClick={() => open(sections[index - 1].id)}>
              ← 前の章
            </button>
            <button className="btn btn-primary" disabled={index >= sections.length - 1} onClick={markReadAndNext}>
              読んだ・次の章へ →
            </button>
          </div>
        </article>
      )}
    </div>
  );
}
