const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  saveProject: (data, defaultPath) => ipcRenderer.invoke('save-project', data, defaultPath),
  loadProject: () => ipcRenderer.invoke('load-project'),
  savePdf: (data, defaultPath) => ipcRenderer.invoke('save-pdf', data, defaultPath),
});


