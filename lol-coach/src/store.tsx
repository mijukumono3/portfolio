import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { AnswerRecord } from './core/progress';
import type { GameResult } from './core/session';

export type SelfRating = 'good' | 'unsure' | 'bad';

export interface DaySession {
  date: string; // YYYY-MM-DD
  results: GameResult[];
  notes: string[]; // 試合ごとの振り返り
  checks?: (string[] | null)[]; // 試合ごとの振り返りチェック（達成した項目ID）。未記入の試合は undefined
}

export interface ReplayNote {
  id: string;
  date: string;
  player: string;
  champion: string;
  role: string;
  time: string; // 試合内の時刻 mm:ss
  situation: string;
  action: string;
  why: string;
  insight: string;
}

export interface AppData {
  version: 1;
  answers: AnswerRecord[];
  workbook: Record<string, { text: string; rating?: SelfRating; updatedAt: number }>;
  bookmarks: string[];
  read: string[];
  sessions: DaySession[];
  insights: { date: string; text: string }[]; // 「悟り」ノート
  replays: ReplayNote[]; // プロのリプレイ分析ノート
}

export const emptyData = (): AppData => ({
  version: 1,
  answers: [],
  workbook: {},
  bookmarks: [],
  read: [],
  sessions: [],
  insights: [],
  replays: [],
});

interface Backend {
  load(): Promise<unknown>;
  save(data: AppData): Promise<unknown>;
  onChanged?(cb: (data: unknown) => void): () => void;
}

export interface AppBridge {
  exportBackup(json: string, defaultName: string): Promise<{ ok: boolean; canceled?: boolean; path?: string }>;
  importBackup(): Promise<{ ok: boolean; canceled?: boolean; text?: string }>;
  toggleMini(): Promise<boolean>;
  importDocx(): Promise<{ ok: boolean; canceled?: boolean; count?: number; error?: string; documentXml?: string; relsXml?: string }>;
  saveImageMap(map: Record<string, string[]>): Promise<boolean>;
  imageMap(): Promise<Record<string, string[]> | null>;
  clearImages(): Promise<boolean>;
  onImagesChanged(cb: () => void): () => void;
  info(): Promise<{ shortcut: string; version: string }>;
}

declare global {
  interface Window {
    lolStore?: Backend;
    lolApp?: AppBridge;
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
  replaceAll: (d: AppData) => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<number>();
  // 他ウィンドウから受け取った内容は保存し直さない（ウィンドウ間で保存が往復しないように）
  const remoteJson = useRef<string | null>(null);
  const normalize = (raw: unknown): AppData => ({ ...emptyData(), ...(raw as Partial<AppData>), version: 1 });

  useEffect(() => {
    backend()
      .load()
      .then((raw) => {
        if (raw && typeof raw === 'object') {
          const d = normalize(raw);
          remoteJson.current = JSON.stringify(d);
          setData(d);
        }
      })
      .finally(() => setLoaded(true));
    return backend().onChanged?.((raw) => {
      if (!raw || typeof raw !== 'object') return;
      const d = normalize(raw);
      remoteJson.current = JSON.stringify(d);
      window.clearTimeout(saveTimer.current);
      setData(d);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (remoteJson.current === JSON.stringify(data)) return;
    remoteJson.current = null;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => void backend().save(data), 250);
  }, [data, loaded]);

  const update = useCallback((fn: (d: AppData) => AppData) => setData((d) => fn(d)), []);
  const replaceAll = useCallback((d: AppData) => setData(d), []);
  return <StoreContext.Provider value={{ data, loaded, update, replaceAll }}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('StoreProvider missing');
  return s;
}
