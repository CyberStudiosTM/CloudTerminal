const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cloudTerminalDesktop', {
  save: (name, text) => ipcRenderer.invoke('document:save', name, text),
});
