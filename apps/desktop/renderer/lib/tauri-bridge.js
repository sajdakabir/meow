/**
 * Tauri bridge — drop-in replacement for window.electronAPI.
 * Uses window.__TAURI__ directly (injected by Tauri via withGlobalTauri: true).
 * No-ops gracefully when running outside Tauri (e.g. in browser dev).
 */

function getTauri() {
  if (typeof window !== 'undefined' && window.__TAURI__) return window.__TAURI__;
  return null;
}

export const tauriBridge = {
  resizeWindow: (height) => {
    const t = getTauri();
    if (t) t.core.invoke('resize_window', { height });
  },

  showNotification: async (title, body) => {
    const t = getTauri();
    if (!t) return;
    try {
      let granted = await t.notification?.isPermissionGranted?.();
      if (!granted) {
        const perm = await t.notification?.requestPermission?.();
        granted = perm === 'granted';
      }
      if (granted) t.notification?.sendNotification?.({ title, body });
    } catch {
      // Notification plugin not available
    }
  },

  updateTrayTitle: (title) => {
    const t = getTauri();
    if (t) t.core.invoke('update_tray_title', { title });
  },

  close: () => {
    const t = getTauri();
    if (t) t.core.invoke('window_close');
  },

  focusWindow: () => {
    const t = getTauri();
    if (t) t.core.invoke('focus_window');
  },

  onStartFocus: async (cb) => {
    const t = getTauri();
    if (t) return t.event.listen('tray-start-focus', () => cb());
    return () => {};
  },

  onPause: async (cb) => {
    const t = getTauri();
    if (t) return t.event.listen('tray-pause', () => cb());
    return () => {};
  },

  onReset: async (cb) => {
    const t = getTauri();
    if (t) return t.event.listen('tray-reset', () => cb());
    return () => {};
  },

  onOpenSettings: async (cb) => {
    const t = getTauri();
    if (t) return t.event.listen('open-settings', () => cb());
    return () => {};
  },

  on: async (event, cb) => {
    const t = getTauri();
    if (t) return t.event.listen(event, () => cb());
    return () => {};
  },

  openUrl: async (url) => {
    const t = getTauri();
    if (t) {
      try {
        await t.core.invoke('plugin:opener|open_url', { url });
      } catch {
        window.open(url, '_blank');
      }
    } else {
      window.open(url, '_blank');
    }
  },

  getTauri,
};
