const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('lolStore', {
  load: () => ipcRenderer.invoke('store:load'),
  save: (data) => ipcRenderer.invoke('store:save', data),
  onChanged: (cb) => {
    const listener = (_e, data) => cb(data);
    ipcRenderer.on('store:changed', listener);
    return () => ipcRenderer.removeListener('store:changed', listener);
  },
});

contextBridge.exposeInMainWorld('lolApp', {
  exportBackup: (json, defaultName) => ipcRenderer.invoke('backup:export', { json, defaultName }),
  importBackup: () => ipcRenderer.invoke('backup:import'),
  toggleMini: () => ipcRenderer.invoke('mini:toggle'),
  info: () => ipcRenderer.invoke('app:info'),
  importDocx: () => ipcRenderer.invoke('images:import'),
  saveImageMap: (map) => ipcRenderer.invoke('images:saveMap', map),
  imageMap: () => ipcRenderer.invoke('images:map'),
  clearImages: () => ipcRenderer.invoke('images:clear'),
  onImagesChanged: (cb) => {
    const listener = () => cb();
    ipcRenderer.on('images:changed', listener);
    return () => ipcRenderer.removeListener('images:changed', listener);
  },
});
