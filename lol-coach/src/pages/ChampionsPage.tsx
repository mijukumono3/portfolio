import { useMemo, useState } from 'react';
import type { Navigate } from '../App';
import { Icon, PageHeader, Panel } from '../components/ui';
import { sections } from '../content';
import { CHAMPIONS, guideSectionsFor, searchChampions, type Champion } from '../core/champions';
import { ADC_LABEL, MID_LABEL, SUPPORT_LABEL, TOP_LABEL } from '../core/matchup';
import { applyChampionToMatchup, type MatchupSlot } from '../matchupState';

const short = (label: string) => label.replace(/（.*$/, '');

export function roleChips(c: Champion): { label: string; slot: MatchupSlot[] }[] {
  const out: { label: string; slot: MatchupSlot[] }[] = [];
  if (c.top) out.push({ label: `トップ：${short(TOP_LABEL[c.top])}`, slot: ['topAlly', 'topEnemy'] });
  if (c.jungle) out.push({ label: 'ジャングル', slot: [] });
  if (c.mid) out.push({ label: `ミッド：${short(MID_LABEL[c.mid])}`, slot: ['midAlly', 'midEnemy'] });
  if (c.adc) out.push({ label: `ADC：${short(ADC_LABEL[c.adc])}`, slot: ['adc'] });
  if (c.support) out.push({ label: `サポート：${short(SUPPORT_LABEL[c.support])}`, slot: ['support'] });
  return out;
}

const SLOT_LABEL: Record<MatchupSlot, string> = {
  topAlly: '味方トップ',
  topEnemy: '敵トップ',
  midAlly: '味方ミッド',
  midEnemy: '敵ミッド',
  adc: '味方ADC',
  support: '味方サポート',
};

export function ChampionsPage({ navigate }: { navigate: Navigate }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const list = useMemo(() => (query.trim() ? searchChampions(query, 60) : CHAMPIONS), [query]);
  const champ = CHAMPIONS.find((c) => c.name === (selected ?? list[0]?.name));
  const guides = champ ? guideSectionsFor(champ.name, sections) : [];
  const slots = champ ? roleChips(champ).flatMap((r) => r.slot) : [];

  return (
    <div className="stack">
      <PageHeader eyebrow="CHAMPIONS" title="チャンピオン">
        名前で検索すると、教科書での分類と攻略ガイドの章が見られます。ガンク判定にもそのまま入れられます。
      </PageHeader>
      <div className="two-pane">
        <aside className="panel side-list" aria-label="チャンピオン一覧">
          <div className="input-icon" style={{ marginBottom: 10 }}>
            <Icon name="search" size={16} />
            <input
              type="search"
              autoFocus
              placeholder="名前で検索（かな・英語OK）"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelected(null);
              }}
            />
          </div>
          <div className="small muted" style={{ padding: '0 10px 6px' }}>
            {list.length}体
          </div>
          <div className="side-scroll">
            {list.map((c) => (
              <button key={c.name} className={`list-item ${c.name === champ?.name ? 'active' : ''}`} onClick={() => setSelected(c.name)}>
                <span className="state">{guideSectionsFor(c.name, sections).length > 0 ? '📘' : ''}</span>
                <span style={{ flex: 1 }}>{c.name}</span>
                {c.en && <span className="small muted">{c.en}</span>}
              </button>
            ))}
            {list.length === 0 && <p className="small muted" style={{ padding: 10 }}>教科書に登場するチャンピオンが見つかりません。</p>}
          </div>
        </aside>

        {champ && (
          <div className="stack">
            <Panel>
              <div className="eyebrow">{champ.en ?? 'CHAMPION'}</div>
              <h1 style={{ marginBottom: 14 }}>{champ.name}</h1>
              <div className="row">
                {roleChips(champ).map((r) => (
                  <span key={r.label} className="chip chip-gold">
                    {r.label}
                  </span>
                ))}
                {roleChips(champ).length === 0 && <span className="chip">攻略ガイドのみ</span>}
              </div>
            </Panel>

            <Panel title="教科書の攻略ガイド" icon="book">
              {guides.length ? (
                <div className="stack-sm">
                  {guides.map((g) => (
                    <button key={g.id} className="action-card" style={{ flexDirection: 'row', alignItems: 'center' }} onClick={() => navigate({ page: 'reader', sectionId: g.id })}>
                      <div className="stat-icon">
                        <Icon name="book" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <strong>{g.title}</strong>
                        <div className="small muted">{g.body.slice(0, 70).replace(/\n/g, ' ')}…</div>
                      </div>
                      <Icon name="arrow" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="small muted">このチャンピオン専用の攻略章はありません。分類は「各レーンの重要度」などに登場します。</p>
              )}
            </Panel>

            {slots.length > 0 && (
              <Panel title="ガンク判定に入れる" icon="map">
                <div className="row">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      className="btn"
                      onClick={() => {
                        applyChampionToMatchup(champ, slot);
                        navigate({ page: 'matchup' });
                      }}
                    >
                      {SLOT_LABEL[slot]}にする
                    </button>
                  ))}
                </div>
              </Panel>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
