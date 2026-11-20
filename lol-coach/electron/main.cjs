const { app, BrowserWindow, ipcMain, shell, dialog, globalShortcut, protocol, net } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { unzipSync, strFromU8 } = require('fflate');

// 教科書の図版を表示する専用スキーム（lolimg://img/<ファイル名>）
protocol.registerSchemesAsPrivileged([{ scheme: 'lolimg', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);
const imagesDir = () => path.join(app.getPath('userData'), 'textbook-images');
const imageMapFile = () => path.join(app.getPath('userData'), 'textbook-images.json');

const MINI_SHORTCUT = 'CommandOrControl+Shift+L';
const dataFile = () => path.join(app.getPath('userData'), 'lol-coach.json');
const indexHtml = path.join(__dirname, '..', 'dist', 'index.html');

let mainWin = null;
let miniWin = null;

// ---------- 記録の保存とウィンドウ間同期 ----------
ipcMain.handle('store:load', () => {
  try {
    return JSON.parse(fs.readFileSync(dataFile(), 'utf8'));
  } catch {
    return null;
  }
});

ipcMain.handle('store:save', (event, data) => {
  const file = dataFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data));
  fs.renameSync(tmp, file);
  // 保存したウィンドウ以外へ最新の記録を通知する
  for (const win of BrowserWindow.getAllWindows()) {
    if (win.webContents !== event.sender && !win.isDestroyed()) win.webContents.send('store:changed', data);
  }
  return true;
});

// ---------- バックアップ ----------
ipcMain.handle('backup:export', async (event, { json, defaultName }) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: '記録をバックアップ',
    defaultPath: path.join(app.getPath('documents'), defaultName),
    filters: [{ name: 'LoL Coach バックアップ', extensions: ['json'] }],
  });
  if (canceled || !filePath) return { ok: false, canceled: true };
  fs.writeFileSync(filePath, json);
  return { ok: true, path: filePath };
});

ipcMain.handle('backup:import', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'バックアップから復元',
    properties: ['openFile'],
    filters: [{ name: 'LoL Coach バックアップ', extensions: ['json'] }],
  });
  if (canceled || !filePaths[0]) return { ok: false, canceled: true };
  return { ok: true, text: fs.readFileSync(filePaths[0], 'utf8') };
});

// ---------- 教科書の図版（元の .docx から取り込み） ----------
ipcMain.handle('images:import', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: '「LOLの教科書.docx」を選んでください',
    properties: ['openFile'],
    filters: [{ name: 'Word 文書', extensions: ['docx'] }],
  });
  if (canceled || !filePaths[0]) return { ok: false, canceled: true };
  let files;
  try {
    files = unzipSync(new Uint8Array(fs.readFileSync(filePaths[0])), {
      filter: (f) => f.name === 'word/document.xml' || f.name === 'word/_rels/document.xml.rels' || f.name.startsWith('word/media/'),
    });
  } catch {
    return { ok: false, error: 'Word 文書（.docx）として読み込めませんでした。' };
  }
  const doc = files['word/document.xml'];
  const rels = files['word/_rels/document.xml.rels'];
  if (!doc || !rels) return { ok: false, error: 'Word 文書の本文が見つかりませんでした。' };
  fs.rmSync(imagesDir(), { recursive: true, force: true });
  fs.mkdirSync(imagesDir(), { recursive: true });
  let count = 0;
  for (const [name, bytes] of Object.entries(files)) {
    if (!name.startsWith('word/media/')) continue;
    fs.writeFileSync(path.join(imagesDir(), path.basename(name)), bytes);
    count += 1;
  }
  return { ok: true, count, documentXml: strFromU8(doc), relsXml: strFromU8(rels) };
});

ipcMain.handle('images:saveMap', (_e, map) => {
  fs.writeFileSync(imageMapFile(), JSON.stringify(map));
  for (const win of BrowserWindow.getAllWindows()) if (!win.isDestroyed()) win.webContents.send('images:changed');
  return true;
});

ipcMain.handle('images:map', () => {
  try {
    return JSON.parse(fs.readFileSync(imageMapFile(), 'utf8'));
  } catch {
    return null;
  }
});

ipcMain.handle('images:clear', () => {
  fs.rmSync(imagesDir(), { recursive: true, force: true });
  fs.rmSync(imageMapFile(), { force: true });
  for (const win of BrowserWindow.getAllWindows()) if (!win.isDestroyed()) win.webContents.send('images:changed');
  return true;
});

function registerImageProtocol() {
  protocol.handle('lolimg', (request) => {
    // ファイル名だけを使い、画像フォルダの外は読ませない
    const name = path.basename(decodeURIComponent(new URL(request.url).pathname));
    const file = path.join(imagesDir(), name);
    if (!name || !fs.existsSync(file)) return new Response('not found', { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });
}

// ---------- ウィンドウ ----------
const webPreferences = {
  preload: path.join(__dirname, 'preload.cjs'),
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
};

function load(win, hash) {
  if (process.env.VITE_DEV_SERVER_URL) win.loadURL(process.env.VITE_DEV_SERVER_URL + (hash ? `#${hash}` : ''));
  else win.loadFile(indexHtml, hash ? { hash } : undefined);
}

function createMainWindow() {
  mainWin = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 900,
    minHeight: 600,
    title: 'LoL Coach',
    backgroundColor: '#060b16',
    autoHideMenuBar: true,
    webPreferences,
  });
  mainWin.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWin.on('closed', () => {
    mainWin = null;
    if (miniWin && !miniWin.isDestroyed()) miniWin.close();
  });
  load(mainWin);
}

function toggleMini() {
  if (miniWin && !miniWin.isDestroyed()) {
    if (miniWin.isVisible() && miniWin.isFocused()) miniWin.hide();
    else {
      miniWin.show();
      miniWin.focus();
    }
    return true;
  }
  miniWin = new BrowserWindow({
    width: 380,
    height: 640,
    minWidth: 320,
    minHeight: 420,
    title: 'LoL Coach ミニ',
    backgroundColor: '#060b16',
    autoHideMenuBar: true,
    alwaysOnTop: true,
    webPreferences,
  });
  miniWin.setAlwaysOnTop(true, 'floating');
  miniWin.on('closed', () => {
    miniWin = null;
  });
  load(miniWin, 'mini');
  return true;
}

ipcMain.handle('mini:toggle', () => toggleMini());
ipcMain.handle('app:info', () => ({ shortcut: MINI_SHORTCUT, version: app.getVersion() }));

app.whenReady().then(() => {
  registerImageProtocol();
  createMainWindow();
  globalShortcut.register(MINI_SHORTCUT, toggleMini);
  app.on('activate', () => {
    if (!mainWin) createMainWindow();
  });
});

app.on('will-quit', () => globalShortcut.unregisterAll());

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
