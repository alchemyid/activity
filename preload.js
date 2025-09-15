// preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    closeWindow: () => ipcRenderer.send('close-window'),
    saveActivity: (data) => ipcRenderer.send('save-activity', data),
    getConfig: () => ipcRenderer.invoke('get-config'),
});