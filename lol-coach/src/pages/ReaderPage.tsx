import { useMemo, useState } from 'react';
import { Icon } from '../components/ui';
import { sections } from '../content';
import { searchSections, type Section } from '../core/search';
import { useStore } from '../store';
import { imageUrl, useImageMap } from '../imageMap';

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return <>{parts.map((p, i) => (p.toLowerCase() === q.toLowerCase() ? <mark key={i}>{p}</mark> : p))}</>;
}

interface Group {
  head: Section;
  title: string;
  children: Section[];
}

/**
 * 原本で見出し記号がエスケープされ章見出しとして取れなかった箇所は、
 * 直後の見出しをグループの先頭として扱い、本来の章名を表示する
 */
const GROUP_BREAKS: Record<string, string> = { 大前提: '各レーンの重要度' };

/** 見出しレベル1を親、それ以降の下位見出しを子としてまとめる */
const groups: Group[] = sections.reduce<Group[]>((acc, s) => {
  if (s.level === 1 || acc.length === 0 || s.title in GROUP_BREAKS)
    acc.push({ head: s, title: GROUP_BREAKS[s.title] ?? s.title, children: [] });
  else acc[acc.length - 1].children.push(s);
  return acc;
}, []);
const groupOf = (id: string) => groups.find((g) => g.head.id === id || g.children.some((c) => c.id === id));

export function ReaderPage({ initialSectionId }: { initialSectionId?: string }) {
  const { data, update } = useStore();
  const [currentId, setCurrentId] = useState(() => initialSectionId ?? sections.find((s) => !data.read.includes(s.id))?.id ?? sections[0].id);
  const [query, setQuery] = useState('');
  const [onlyBookmarks, setOnlyBookmarks] = useState(false);
  const [open, setOpen] = useState<Set<string>>(() => new Set([groupOf(currentId)?.head.id ?? '']));
  const hits = useMemo(() => searchSections(sections, query), [query]);
  const index = sections.findIndex((s) => s.id === currentId);
  const current = sections[index];
  const isRead = data.read.includes(currentId);
  const isBookmarked = data.bookmarks.includes(currentId);
  const readPct = Math.round((data.read.length / sections.length) * 100);
  const imageMap = useImageMap();
  const figures = imageMap?.[currentId] ?? [];
  const [zoom, setZoom] = useState<string | null>(null);

  const go = (id: string) => {
    setCurrentId(id);
    const g = groupOf(id);
    if (g) setOpen((o) => new Set(o).add(g.head.id));
    document.querySelector('.main')?.scrollTo({ top: 0 });
  };
  const toggle = (key: 'read' | 'bookmarks') =>
    update((d) => ({ ...d, [key]: d[key].includes(currentId) ? d[key].filter((x) => x !== currentId) : [...d[key], currentId] }));
  const markReadAndNext = () => {
    if (!isRead) update((d) => ({ ...d, read: [...d.read, currentId] }));
    const next = sections[index + 1];
    if (next) go(next.id);
  };
  const toggleGroup = (id: string) =>
    setOpen((o) => {
      const n = new Set(o);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const item = (s: Section, indent = 0) => (
    <button key={s.id} className={`list-item ${s.id === currentId ? 'active' : ''}`} style={{ paddingLeft: 10 + indent * 12 }} onClick={() => go(s.id)}>
      <span className="state">{data.bookmarks.includes(s.id) ? '🔖' : data.read.includes(s.id) ? '✓' : ''}</span>
      <span style={{ flex: 1 }}>{s.title}</span>
      {imageMap?.[s.id]?.length ? (
        <span className="muted" title={`図 ${imageMap[s.id].length}枚`}>
          <Icon name="image" size={13} />
        </span>
      ) : null}
    </button>
  );

  return (
    <div className="two-pane">
      <aside className="panel side-list" aria-label="目次">
        <div className="input-icon">
          <Icon name="search" size={16} />
          <input type="search" placeholder="教科書を検索（例：ヴォイドグラブ）" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="read-progress" title={`既読 ${readPct}%`}>
          <span style={{ width: `${readPct}%` }} />
        </div>
        <label className="row small muted" style={{ marginBottom: 6 }}>
          <input type="checkbox" checked={onlyBookmarks} onChange={(e) => setOnlyBookmarks(e.target.checked)} /> しおりのみ（{data.bookmarks.length}）
          <span style={{ marginLeft: 'auto' }} className="num">
            既読 {readPct}%
          </span>
        </label>
        <div className="side-scroll">
          {query.trim() ? (
            <>
              <div className="small muted" style={{ padding: '4px 10px' }}>
                {hits.length}件の章がヒット
              </div>
              {hits.map((h) => (
                <button key={h.id} className={`list-item ${h.id === currentId ? 'active' : ''}`} onClick={() => go(h.id)}>
                  <span className="chip num" style={{ flex: 'none' }}>
                    {h.count}
                  </span>
                  <span>
                    {h.title}
                    <span className="hit-snippet">
                      <Highlight text={h.snippet} query={query} />
                    </span>
                  </span>
                </button>
              ))}
            </>
          ) : onlyBookmarks ? (
            sections.filter((s) => data.bookmarks.includes(s.id)).map((s) => item(s))
          ) : (
            groups.map((g) => {
              const isOpen = open.has(g.head.id);
              const readIn = [g.head, ...g.children].filter((s) => data.read.includes(s.id)).length;
              return (
                <div key={g.head.id}>
                  {g.children.length === 0 ? (
                    item(g.head)
                  ) : (
                    <>
                      <button className={`list-group ${isOpen ? 'open' : ''}`} onClick={() => toggleGroup(g.head.id)} aria-expanded={isOpen}>
                        <span className="caret">▶</span>
                        <span style={{ flex: 1 }}>{g.title}</span>
                        <span className="small muted num">
                          {readIn}/{g.children.length + 1}
                        </span>
                      </button>
                      {isOpen && (
                        <>
                          {item(g.head, 1)}
                          {g.children.map((c) => item(c, c.level - 1))}
                        </>
                      )}
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>

      {current && (
        <article className="panel article">
          <div className="article-inner">
            <div className="row spread">
              <span className="eyebrow" style={{ margin: 0 }}>
                {(() => {
                  const g = groupOf(current.id);
                  return g && (g.head.id !== current.id || g.title !== current.title) ? g.title : `CHAPTER ${index + 1}`;
                })()}
              </span>
              <div className="row">
                <button className="btn btn-ghost" onClick={() => toggle('bookmarks')} aria-pressed={isBookmarked}>
                  <Icon name="bookmark" size={15} />
                  {isBookmarked ? 'しおり済み' : 'しおり'}
                </button>
                <button className="btn btn-ghost" onClick={() => toggle('read')} aria-pressed={isRead}>
                  <Icon name="check" size={15} />
                  {isRead ? '既読' : '未読'}
                </button>
              </div>
            </div>
            <h1>{current.title}</h1>
            <div className="article-body">
              {current.body ? <Highlight text={current.body} query={query} /> : <span className="muted">（この見出しの本文は次の章に続きます）</span>}
            </div>
            {figures.length > 0 && (
              <div className="figures" aria-label="この章の図">
                {figures.map((f, i) => (
                  <button key={f} className="figure" onClick={() => setZoom(f)} aria-label={`図${i + 1}を拡大`}>
                    <img src={imageUrl(f)} alt={`${current.title} の図${i + 1}`} loading="lazy" />
                    <span className="small muted">図{i + 1}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="article-foot">
              <button className="btn" disabled={index <= 0} onClick={() => go(sections[index - 1].id)}>
                ← 前の章
              </button>
              <span className="small muted num" style={{ alignSelf: 'center' }}>
                {index + 1} / {sections.length}
              </span>
              <button className="btn btn-primary" disabled={index >= sections.length - 1} onClick={markReadAndNext}>
                読んだ・次の章へ <Icon name="arrow" size={16} />
              </button>
            </div>
          </div>
        </article>
      )}
      {zoom && (
        <div className="lightbox" role="dialog" aria-label="図の拡大表示" onClick={() => setZoom(null)} onKeyDown={(e) => e.key === 'Escape' && setZoom(null)} tabIndex={-1}>
          <img src={imageUrl(zoom)} alt="拡大した図" />
          <span className="small muted">クリックで閉じる</span>
        </div>
      )}
    </div>
  );
}
