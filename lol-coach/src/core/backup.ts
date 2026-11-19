import type { AppData } from '../store';

export const BACKUP_APP = 'lol-coach';

export function serializeBackup(data: AppData, now = new Date()): string {
  return JSON.stringify({ app: BACKUP_APP, exportedAt: now.toISOString(), data }, null, 1);
}

export type BackupResult = { ok: true; data: AppData } | { ok: false; error: string };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** バックアップファイルの内容を検証して AppData に戻す。不正なら何も返さずエラー */
export function parseBackup(text: string): BackupResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'JSONとして読み込めませんでした。' };
  }
  if (!isObj(raw) || raw.app !== BACKUP_APP || !isObj(raw.data)) {
    return { ok: false, error: 'LoL Coach のバックアップファイルではありません。' };
  }
  const d = raw.data;
  const arrayKeys = ['answers', 'bookmarks', 'read', 'sessions', 'insights'] as const;
  for (const k of arrayKeys) {
    if (d[k] !== undefined && !Array.isArray(d[k])) return { ok: false, error: `「${k}」の形式が正しくありません。` };
  }
  if (d.workbook !== undefined && !isObj(d.workbook)) return { ok: false, error: '「workbook」の形式が正しくありません。' };

  const answers = (d.answers ?? []) as unknown[];
  if (!answers.every((a) => isObj(a) && typeof a.questionId === 'string' && typeof a.correct === 'boolean' && typeof a.at === 'number')) {
    return { ok: false, error: 'ドリルの回答記録が壊れています。' };
  }
  const sessions = (d.sessions ?? []) as unknown[];
  if (
    !sessions.every(
      (s) => isObj(s) && typeof s.date === 'string' && Array.isArray(s.results) && s.results.every((r) => r === 'W' || r === 'L') && Array.isArray(s.notes),
    )
  ) {
    return { ok: false, error: '3戦セットの記録が壊れています。' };
  }

  return {
    ok: true,
    data: {
      version: 1,
      answers: answers as AppData['answers'],
      workbook: (d.workbook ?? {}) as AppData['workbook'],
      bookmarks: ((d.bookmarks ?? []) as unknown[]).filter((x): x is string => typeof x === 'string'),
      read: ((d.read ?? []) as unknown[]).filter((x): x is string => typeof x === 'string'),
      sessions: sessions as AppData['sessions'],
      insights: ((d.insights ?? []) as unknown[]).filter(
        (x): x is AppData['insights'][number] => isObj(x) && typeof x.date === 'string' && typeof x.text === 'string',
      ),
    },
  };
}
