import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { AnswerRecord } from './core/progress';
import type { GameResult } from './core/session';

export type SelfRating = 'good' | 'unsure' | 'bad';

export interface DaySession {
  date: string; // YYYY-MM-DD
  results: GameResult[];
  notes: string[]; // 試合ごとの振り返り
}

export interface AppData {
  version: 1;
  answers: AnswerRecord[];
  workbook: Record<string, { text: string; rating?: SelfRating; updatedAt: number }>;
  bookmarks: string[];
  read: string[];
  sessions: DaySession[];
  insights: { date: string; text: string }[]; // 「悟り」ノート
}

export const emptyData = (): AppData => ({
  version: 1,
  answers: [],
  workbook: {},
  bookmarks: [],
  read: [],
  sessions: [],
  insights: [],
});

interface Backend {
  load(): Promise<unknown>;
  save(data: AppData): Promise<unknown>;
}

declare global {
  interface Window {
    lolStore?: Backend;
  }
}

const LS_KEY = 'lol-coach-data';
const localBackend: Backend = {
  async load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  async save(data) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    } catch {
      /* 保存できない環境では無視 */
    }
  },
};

const backend = (): Backend => window.lolStore ?? localBackend;

export const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

interface Store {
  data: AppData;
  loaded: boolean;
  update: (fn: (d: AppData) => AppData) => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<number>();

  useEffect(() => {
    backend()
      .load()
      .then((raw) => {
        if (raw && typeof raw === 'object') setData({ ...emptyData(), ...(raw as Partial<AppData>), version: 1 });
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => void backend().save(data), 300);
  }, [data, loaded]);

  const update = useCallback((fn: (d: AppData) => AppData) => setData((d) => fn(d)), []);
  return <StoreContext.Provider value={{ data, loaded, update }}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('StoreProvider missing');
  return s;
}
