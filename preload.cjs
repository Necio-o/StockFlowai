const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  createDesktopShortcut: () => ipcRenderer.invoke('create-desktop-shortcut')
});
