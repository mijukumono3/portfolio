import { useState } from 'react';
import { HomePage } from './pages/HomePage';
import { ReaderPage } from './pages/ReaderPage';
import { DrillPage } from './pages/DrillPage';
import { WorkbookPage } from './pages/WorkbookPage';
import { MatchupPage } from './pages/MatchupPage';
import { SessionPage } from './pages/SessionPage';
import { useStore } from './store';
import type { Subject } from './core/progress';

export type Route =
  | { page: 'home' }
  | { page: 'reader'; sectionId?: string }
  | { page: 'drill'; subject?: Subject | 'review' }
  | { page: 'workbook' }
  | { page: 'matchup' }
  | { page: 'session' };

export type Navigate = (r: Route) => void;

const NAV: { page: Route['page']; label: string; icon: string }[] = [
  { page: 'home', label: 'ホーム', icon: '⌂' },
  { page: 'session', label: '3戦セット', icon: '⚔' },
  { page: 'drill', label: '判断力ドリル', icon: '✎' },
  { page: 'workbook', label: 'ワークブック', icon: '❏' },
  { page: 'matchup', label: 'ガンク判定', icon: '⌖' },
  { page: 'reader', label: '教科書', icon: '❖' },
];

export function App() {
  const [route, setRoute] = useState<Route>({ page: 'home' });
  const { loaded } = useStore();
  const navigate: Navigate = (r) => {
    setRoute(r);
    document.querySelector('.main')?.scrollTo(0, 0);
  };

  return (
    <div className="app">
      <nav className="sidebar" aria-label="メインメニュー">
        <div className="brand">
          <span className="brand-mark">LC</span>
          <div>
            <div className="brand-name">LoL Coach</div>
            <div className="brand-sub">LOLの教科書で上達</div>
          </div>
        </div>
        {NAV.map((n) => (
          <button
            key={n.page}
            className={`nav-item ${route.page === n.page ? 'active' : ''}`}
            onClick={() => navigate({ page: n.page } as Route)}
          >
            <span className="nav-icon" aria-hidden>
              {n.icon}
            </span>
            {n.label}
          </button>
        ))}
      </nav>
      <main className="main">
        {!loaded ? (
          <p className="muted">読み込み中…</p>
        ) : route.page === 'home' ? (
          <HomePage navigate={navigate} />
        ) : route.page === 'reader' ? (
          <ReaderPage key={route.sectionId ?? 'toc'} initialSectionId={route.sectionId} />
        ) : route.page === 'drill' ? (
          <DrillPage key={route.subject ?? 'all'} initialSubject={route.subject} navigate={navigate} />
        ) : route.page === 'workbook' ? (
          <WorkbookPage navigate={navigate} />
        ) : route.page === 'matchup' ? (
          <MatchupPage />
        ) : (
          <SessionPage />
        )}
      </main>
    </div>
  );
}
