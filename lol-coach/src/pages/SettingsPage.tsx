import { useEffect, useRef, useState } from 'react';
import { Icon, PageHeader, Panel } from '../components/ui';
import { parseBackup, serializeBackup } from '../core/backup';
import { todayKey, useStore, type AppData } from '../store';

function summary(d: AppData) {
  const games = d.sessions.reduce((n, s) => n + s.results.length, 0);
  return `ドリル回答 ${d.answers.length}件 ・ ランク戦 ${games}試合 ・ ワークブック ${Object.keys(d.workbook).length}問 ・ 悟り ${d.insights.length}行`;
}

export function SettingsPage() {
  const { data, replaceAll } = useStore();
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [shortcut, setShortcut] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const isApp = Boolean(window.lolApp);

  useEffect(() => {
    window.lolApp?.info().then((i) => setShortcut(i.shortcut.replace('CommandOrControl', 'Ctrl')));
  }, []);

  const doExport = async () => {
    const json = serializeBackup(data);
    const name = `lol-coach-backup-${todayKey()}.json`;
    if (window.lolApp) {
      const r = await window.lolApp.exportBackup(json, name);
      if (r.ok) setMessage({ kind: 'ok', text: `バックアップを保存しました：${r.path}` });
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
    setMessage({ kind: 'ok', text: 'バックアップをダウンロードしました。' });
  };

  const restore = (text: string) => {
    const r = parseBackup(text);
    if (!r.ok) {
      setMessage({ kind: 'error', text: r.error });
      return;
    }
    const ok = window.confirm(`現在の記録をバックアップの内容で置き換えます。\n\n現在：${summary(data)}\n復元：${summary(r.data)}\n\nよろしいですか？`);
    if (!ok) return;
    replaceAll(r.data);
    setMessage({ kind: 'ok', text: `復元しました（${summary(r.data)}）` });
  };

  const doImport = async () => {
    if (window.lolApp) {
      const r = await window.lolApp.importBackup();
      if (r.ok && r.text !== undefined) restore(r.text);
      return;
    }
    fileInput.current?.click();
  };

  return (
    <div className="stack">
      <PageHeader eyebrow="SETTINGS" title="設定">
        記録のバックアップと、試合中に使うミニウィンドウの設定です。
      </PageHeader>

      {message && (
        <div className={`verdict ${message.kind === 'ok' ? 'continue' : 'stop'}`} role="status">
          <span className="dot" />
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <Panel title="記録のバックアップ" icon="bookmark">
          <p className="small muted" style={{ marginBottom: 14 }}>
            すべての記録を1つのファイルに書き出します。PCの買い替えや再インストールの前に保存しておきましょう。
          </p>
          <div className="q-body small" style={{ marginBottom: 14 }}>
            {summary(data)}
          </div>
          <div className="row">
            <button className="btn btn-primary" onClick={doExport}>
              バックアップを保存
            </button>
            <button className="btn" onClick={doImport}>
              バックアップから復元
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) restore(await f.text());
                e.target.value = '';
              }}
            />
          </div>
          <p className="small muted" style={{ marginTop: 12 }}>
            復元すると現在の記録は置き換わります（実行前に確認が出ます）。
          </p>
        </Panel>

        <Panel title="ミニウィンドウ" icon="timer">
          <p className="small muted" style={{ marginBottom: 14 }}>
            常に最前面に表示される小さなウィンドウです。試合中にゲームの横に置いて、3戦セットの勝敗入力とガンク判定だけを素早く使えます。
          </p>
          {isApp ? (
            <>
              <button className="btn btn-primary" onClick={() => window.lolApp?.toggleMini()}>
                <Icon name="timer" />
                ミニウィンドウを開く／閉じる
              </button>
              {shortcut && (
                <p className="small" style={{ marginTop: 12 }}>
                  ショートカット：<span className="kbd">{shortcut}</span>（アプリが裏にあっても使えます）
                </p>
              )}
            </>
          ) : (
            <p className="small muted">デスクトップアプリ版でのみ使えます。</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
