import { useState } from 'react';
import { HomePage } from './pages/HomePage';
import { ReaderPage } from './pages/ReaderPage';
import { DrillPage } from './pages/DrillPage';
import { WorkbookPage } from './pages/WorkbookPage';
import { MatchupPage } from './pages/MatchupPage';
import { SessionPage } from './pages/SessionPage';
import { ChampionsPage } from './pages/ChampionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { RoutesPage } from './pages/RoutesPage';
import { ReplayPage } from './pages/ReplayPage';
import { todayKey, useStore } from './store';
import type { Subject } from './core/progress';
import { evaluateSession } from './core/session';
import { Icon, type IconName } from './components/ui';

export type Route =
  | { page: 'home' }
  | { page: 'reader'; sectionId?: string }
  | { page: 'drill'; subject?: Subject | 'review'; ids?: string[]; label?: string }
  | { page: 'routes' }
  | { page: 'replays' }
  | { page: 'champions' }
  | { page: 'settings' }
  | { page: 'workbook' }
  | { page: 'matchup' }
  | { page: 'session' };

export type Navigate = (r: Route) => void;

const NAV: { group: string; items: { page: Route['page']; label: string; icon: IconName }[] }[] = [
  { group: 'OVERVIEW', items: [{ page: 'home', label: 'ホーム', icon: 'home' }] },
  {
    group: 'TRAINING',
    items: [
      { page: 'session', label: '3戦セット', icon: 'swords' },
      { page: 'drill', label: '判断力ドリル', icon: 'target' },
      { page: 'workbook', label: 'ワークブック', icon: 'pen' },
      { page: 'routes', label: 'ルート練習', icon: 'route' },
      { page: 'replays', label: 'リプレイ分析', icon: 'play' },
    ],
  },
  {
    group: 'KNOWLEDGE',
    items: [
      { page: 'matchup', label: 'ガンク判定', icon: 'map' },
      { page: 'champions', label: 'チャンピオン', icon: 'search' },
      { page: 'reader', label: '教科書', icon: 'book' },
    ],
  },
];

export function App() {
  const [route, setRoute] = useState<Route>({ page: 'home' });
  const { loaded, data } = useStore();
  const today = data.sessions.find((x) => x.date === todayKey())?.results ?? [];
  const todayEval = evaluateSession(today);
  const navigate: Navigate = (r) => {
    setRoute(r);
    document.querySelector('.main')?.scrollTo({ top: 0 });
  };

  return (
    <div className="app">
      <nav className="sidebar" aria-label="メインメニュー">
        <div className="brand">
          <span className="brand-mark">LC</span>
          <div>
            <div className="brand-name">LoL Coach</div>
            <div className="brand-sub">LOLの教科書で上達する</div>
          </div>
        </div>
        {NAV.map((g) => (
          <div key={g.group}>
            <div className="nav-group">{g.group}</div>
            {g.items.map((n) => (
              <button
                key={n.page}
                className={`nav-item ${route.page === n.page ? 'active' : ''}`}
                aria-current={route.page === n.page ? 'page' : undefined}
                onClick={() => navigate({ page: n.page } as Route)}
              >
                <Icon name={n.icon} />
                {n.label}
              </button>
            ))}
          </div>
        ))}
        <div style={{ marginTop: 'auto' }} />
        {window.lolApp && (
          <button className="nav-item" onClick={() => window.lolApp?.toggleMini()} title="常に最前面の小さなウィンドウ（Ctrl+Shift+L）">
            <Icon name="timer" />
            ミニ表示
            <span className="nav-badge">Ctrl+Shift+L</span>
          </button>
        )}
        <button className={`nav-item ${route.page === 'settings' ? 'active' : ''}`} onClick={() => navigate({ page: 'settings' })}>
          <Icon name="spark" />
          設定・バックアップ
        </button>
        <button className="sidebar-foot" style={{ textAlign: 'left' }} onClick={() => navigate({ page: 'session' })}>
          <div className="small muted">今日のランク戦</div>
          <div style={{ fontWeight: 700 }}>
            {today.length === 0 ? 'まだ未プレイ' : `${todayEval.wins}勝${todayEval.losses}敗`}
            <span className={`chip ${todayEval.status === 'stop' ? 'chip-enemy' : 'chip-ally'}`} style={{ marginLeft: 8 }}>
              {todayEval.status === 'stop' ? '終了' : '続行可'}
            </span>
          </div>
          <div className="mini-pips">
            {Array.from({ length: Math.max(3, today.length) }, (_, i) => (
              <span key={i} className={today[i] ?? ''} />
            ))}
          </div>
        </button>
      </nav>
      <main className="main">
        <div className="content" key={route.page}>
        {!loaded ? (
          <p className="muted">読み込み中…</p>
        ) : route.page === 'home' ? (
          <HomePage navigate={navigate} />
        ) : route.page === 'reader' ? (
          <ReaderPage key={route.sectionId ?? 'toc'} initialSectionId={route.sectionId} />
        ) : route.page === 'drill' ? (
          <DrillPage key={route.ids ? `ids-${route.ids.join()}` : route.subject ?? 'all'} initialSubject={route.subject} fixedIds={route.ids} fixedLabel={route.label} navigate={navigate} />
        ) : route.page === 'workbook' ? (
          <WorkbookPage navigate={navigate} />
        ) : route.page === 'matchup' ? (
          <MatchupPage />
        ) : route.page === 'champions' ? (
          <ChampionsPage navigate={navigate} />
        ) : route.page === 'routes' ? (
          <RoutesPage navigate={navigate} />
        ) : route.page === 'replays' ? (
          <ReplayPage />
        ) : route.page === 'settings' ? (
          <SettingsPage />
        ) : (
          <SessionPage />
        )}
        </div>
      </main>
    </div>
  );
}
