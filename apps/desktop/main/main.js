const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, nativeImage, Notification, protocol, screen } = require('electron');
const path = require('path');
const fs = require('fs');

// Fix transparency on macOS — must be called before app.whenReady()
app.disableHardwareAcceleration();

const isDev = process.env.ZEN_DEV === '1';
const DEV_URL = 'http://localhost:3456';
const OUT_DIR = path.join(__dirname, '..', 'renderer', 'out');

let popoverWindow = null;
let companionWindow = null;
let tray = null;
let isQuitting = false;
let hideTimeout = null;
let mouseCheckInterval = null;
let notchDetectionInterval = null;

// ── Mime types ──
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.html': 'text/html', '.js': 'application/javascript',
    '.css': 'text/css', '.json': 'application/json',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon', '.wav': 'audio/wav', '.mp3': 'audio/mpeg',
    '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
    '.txt': 'text/plain',
  };
  return types[ext] || 'application/octet-stream';
}

// ── Custom protocol for static files ──
function setupProtocol() {
  protocol.handle('app', (request) => {
    let reqPath = new URL(request.url).pathname;
    if (reqPath.startsWith('/')) reqPath = reqPath.substring(1);
    if (!reqPath || reqPath === '') reqPath = 'index.html';

    const filePath = path.join(OUT_DIR, reqPath);
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(path.resolve(OUT_DIR))) {
      return new Response('Forbidden', { status: 403 });
    }

    try {
      if (fs.existsSync(resolvedPath)) {
        const data = fs.readFileSync(resolvedPath);
        return new Response(data, {
          headers: { 'Content-Type': getMimeType(resolvedPath) },
        });
      }
    } catch (e) { /* fall through */ }

    return new Response('Not Found', { status: 404 });
  });
}

// ── Position popover at top center of screen (below menu bar / notch) ──
function getPopoverPosition() {
  const display = screen.getPrimaryDisplay();
  const windowBounds = popoverWindow.getBounds();

  const x = Math.round(display.workArea.x + display.workArea.width / 2 - windowBounds.width / 2);
  const y = display.workArea.y;

  return { x, y };
}

function showPopover(focusWindow = true) {
  if (!popoverWindow || popoverWindow.isDestroyed()) return;
  cancelHide();

  const { x, y } = getPopoverPosition();
  popoverWindow.setPosition(x, y, false);

  if (focusWindow) {
    popoverWindow.show();
    popoverWindow.focus();
  } else {
    popoverWindow.showInactive();
  }

  startMouseCheck();
}

function hidePopover() {
  cancelHide();
  stopMouseCheck();
  if (popoverWindow && !popoverWindow.isDestroyed()) popoverWindow.hide();
}

function cancelHide() {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }
}

function togglePopover() {
  if (popoverWindow && popoverWindow.isVisible()) {
    hidePopover();
  } else {
    showPopover(true);
  }
}

// ── Mouse tracking: auto-hide when cursor leaves popover area ──
function startMouseCheck() {
  stopMouseCheck();
  mouseCheckInterval = setInterval(() => {
    if (!popoverWindow || !popoverWindow.isVisible() || popoverWindow.isDestroyed()) {
      stopMouseCheck();
      return;
    }

    if (popoverWindow.isFocused()) return;

    const point = screen.getCursorScreenPoint();
    const bounds = popoverWindow.getBounds();
    const margin = 40;

    const inPopover = (
      point.x >= bounds.x - margin &&
      point.x <= bounds.x + bounds.width + margin &&
      point.y >= bounds.y - margin &&
      point.y <= bounds.y + bounds.height + margin
    );

    const display = screen.getPrimaryDisplay();
    const centerX = display.bounds.x + display.bounds.width / 2;
    const inTriggerZone = (
      point.y < display.workArea.y &&
      Math.abs(point.x - centerX) < 200
    );

    if (!inPopover && !inTriggerZone) {
      hidePopover();
    }
  }, 300);
}

function stopMouseCheck() {
  if (mouseCheckInterval) {
    clearInterval(mouseCheckInterval);
    mouseCheckInterval = null;
  }
}

// ── Notch hover detection ──
function startNotchDetection() {
  notchDetectionInterval = setInterval(() => {
    if (popoverWindow && popoverWindow.isVisible()) return;

    const point = screen.getCursorScreenPoint();
    const display = screen.getPrimaryDisplay();
    const centerX = display.bounds.x + display.bounds.width / 2;

    const inNotchArea = (
      point.y <= display.bounds.y + 5 &&
      Math.abs(point.x - centerX) < 120
    );

    if (inNotchArea) {
      showPopover(false);
    }
  }, 200);
}

// ── Create the popover window ──
function createPopoverWindow() {
  popoverWindow = new BrowserWindow({
    width: 350,
    height: 160,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    popoverWindow.loadURL(DEV_URL);
  } else {
    popoverWindow.loadURL('app://bundle/index.html');
  }

  popoverWindow.on('blur', () => {
    setTimeout(() => {
      if (popoverWindow && !popoverWindow.isDestroyed() && !popoverWindow.isFocused()) {
        const point = screen.getCursorScreenPoint();
        const bounds = popoverWindow.getBounds();
        const margin = 20;
        const inBounds = (
          point.x >= bounds.x - margin &&
          point.x <= bounds.x + bounds.width + margin &&
          point.y >= bounds.y - margin &&
          point.y <= bounds.y + bounds.height + margin
        );
        if (!inBounds) {
          hidePopover();
        }
      }
    }, 200);
  });

  popoverWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      hidePopover();
    }
  });
}

// ── Create the desktop companion window (sleeping pal at bottom of screen) ──
function createCompanionWindow() {
  const display = screen.getPrimaryDisplay();
  const companionWidth = 160;
  const companionHeight = 100;

  companionWindow = new BrowserWindow({
    width: companionWidth,
    height: companionHeight,
    x: Math.round(display.workArea.x + display.workArea.width / 2 - companionWidth / 2),
    y: display.workArea.y + display.workArea.height - companionHeight,
    show: true,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    focusable: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Click-through — mouse events pass to windows below
  companionWindow.setIgnoreMouseEvents(true, { forward: true });

  if (isDev) {
    companionWindow.loadURL(DEV_URL + '/companion');
  } else {
    companionWindow.loadURL('app://bundle/companion.html');
  }

  companionWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      companionWindow.hide();
    }
  });
}

// ── Tray setup ──
function createTray() {
  const iconPath = path.join(__dirname, '..', 'renderer', 'public', 'tray-icon.png');
  let trayIcon;

  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    trayIcon = trayIcon.resize({ width: 18, height: 18 });
    if (process.platform === 'darwin') {
      trayIcon.setTemplateImage(true);
    }
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('Zen Focus');

  tray.on('click', () => {
    togglePopover();
  });

  if (process.platform === 'darwin') {
    tray.on('mouse-enter', () => {
      if (!popoverWindow || !popoverWindow.isVisible()) {
        showPopover(false);
      }
    });
  }

  tray.on('right-click', () => {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Start Focus',
        click: () => {
          showPopover(true);
          popoverWindow.webContents.send('tray-start-focus');
        },
      },
      { type: 'separator' },
      {
        label: 'Settings...',
        click: () => {
          showPopover(true);
          popoverWindow.webContents.send('open-settings');
        },
      },
      { type: 'separator' },
      {
        label: 'Quit Zen Focus',
        accelerator: 'CommandOrControl+Q',
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]);
    tray.popUpContextMenu(contextMenu);
  });
}

// ── Global shortcuts ──
function registerShortcuts() {
  globalShortcut.register('CommandOrControl+Shift+F', () => {
    togglePopover();
  });
}

// ── IPC handlers ──
ipcMain.on('show-notification', (_, { title, body }) => {
  new Notification({ title, body }).show();
});

ipcMain.on('update-tray-title', (_, title) => {
  if (tray) tray.setTitle(title);
});

ipcMain.on('window-close', () => {
  hidePopover();
});

ipcMain.on('resize-window', (_, { height }) => {
  if (popoverWindow && !popoverWindow.isDestroyed()) {
    const bounds = popoverWindow.getBounds();
    const clampedHeight = Math.max(100, Math.min(height, 600));
    popoverWindow.setBounds({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: clampedHeight,
    });
  }
});

// ── App lifecycle ──
app.dock && app.dock.hide();

app.whenReady().then(() => {
  setupProtocol();
  createTray();
  createPopoverWindow();
  createCompanionWindow();
  registerShortcuts();
  startNotchDetection();

  setTimeout(() => showPopover(true), 500);

  app.on('activate', () => showPopover(true));
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  isQuitting = true;
  if (notchDetectionInterval) clearInterval(notchDetectionInterval);
  stopMouseCheck();
  globalShortcut.unregisterAll();
});
