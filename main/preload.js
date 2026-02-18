const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close'),

  // Notifications
  showNotification: (title, body) => ipcRenderer.send('show-notification', { title, body }),

  // Tray
  updateTrayTitle: (title) => ipcRenderer.send('update-tray-title', title),

  // Listen for tray actions
  onStartFocus: (callback) => ipcRenderer.on('tray-start-focus', callback),
  onPause: (callback) => ipcRenderer.on('tray-pause', callback),
  onReset: (callback) => ipcRenderer.on('tray-reset', callback),
  onOpenSettings: (callback) => ipcRenderer.on('open-settings', callback),

  // Window events
  onWindowBlur: (callback) => ipcRenderer.on('window-blur', callback),
  onWindowFocus: (callback) => ipcRenderer.on('window-focus', callback),

  // Cleanup
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
