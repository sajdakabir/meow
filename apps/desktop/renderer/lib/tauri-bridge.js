/**
 * Tauri bridge — drop-in replacement for window.electronAPI.
 * Uses @tauri-apps/api under the hood.
 * No-ops gracefully when running outside Tauri (e.g. in browser dev).
 */

let invoke = null;
let listenFn = null;
let notification = null;
let ready = false;

const init = (async () => {
  if (typeof window === 'undefined') return;
  if (!window.__TAURI__) return;
  try {
    const core = await import('@tauri-apps/api/core');
    const event = await import('@tauri-apps/api/event');
    const notif = await import('@tauri-apps/plugin-notification');
    invoke = core.invoke;
    listenFn = event.listen;
    notification = notif;
    ready = true;
  } catch {
    // Not in Tauri — running in plain browser
  }
})();

export const tauriBridge = {
  // ── Commands (renderer → backend) ──

  resizeWindow: async (height) => {
    await init;
    if (invoke) invoke('resize_window', { height });
  },

  showNotification: async (title, body) => {
    await init;
    if (!notification) return;
    let granted = await notification.isPermissionGranted();
    if (!granted) {
      const perm = await notification.requestPermission();
      granted = perm === 'granted';
    }
    if (granted) notification.sendNotification({ title, body });
  },

  updateTrayTitle: async (title) => {
    await init;
    if (invoke) invoke('update_tray_title', { title });
  },

  close: async () => {
    await init;
    if (invoke) invoke('window_close');
  },

  // ── Events (backend → renderer) ──

  onStartFocus: async (cb) => {
    await init;
    if (listenFn) return listenFn('tray-start-focus', () => cb());
    return () => {};
  },

  onPause: async (cb) => {
    await init;
    if (listenFn) return listenFn('tray-pause', () => cb());
    return () => {};
  },

  onReset: async (cb) => {
    await init;
    if (listenFn) return listenFn('tray-reset', () => cb());
    return () => {};
  },

  onOpenSettings: async (cb) => {
    await init;
    if (listenFn) return listenFn('open-settings', () => cb());
    return () => {};
  },
};
