const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  saveProject: (data, defaultPath) => ipcRenderer.invoke('save-project', data, defaultPath),
  loadProject: (fileType) => ipcRenderer.invoke('load-project', fileType),
  savePdf: (defaultPath) => ipcRenderer.invoke('save-pdf', defaultPath),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  onOpenFile: (callback) => ipcRenderer.on('open-file-path', (_event, value) => callback(value)),
});