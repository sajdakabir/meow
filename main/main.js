const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, nativeImage, Notification, protocol, screen } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.ZEN_DEV === '1';
const DEV_URL = 'http://localhost:3456';
const OUT_DIR = path.join(__dirname, '..', 'renderer', 'out');

let popoverWindow = null;
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
  const y = display.workArea.y + 4;

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

    // Don't auto-hide if the window is focused (user is interacting)
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

    // Also keep alive if cursor is in the notch trigger zone
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

// ── Notch hover detection: show popover when cursor pushes to top-center ──
function startNotchDetection() {
  notchDetectionInterval = setInterval(() => {
    if (popoverWindow && popoverWindow.isVisible()) return;

    const point = screen.getCursorScreenPoint();
    const display = screen.getPrimaryDisplay();
    const centerX = display.bounds.x + display.bounds.width / 2;

    // Trigger when cursor is pushed to the very top of the screen, near center
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
    width: 340,
    height: 148,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: true,
    backgroundColor: '#00000000',
    roundedCorners: true,
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

  // Hide when window loses focus (user clicked elsewhere)
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

  // Left click toggles the popover
  tray.on('click', () => {
    togglePopover();
  });

  // Hover to show (macOS)
  if (process.platform === 'darwin') {
    tray.on('mouse-enter', () => {
      if (!popoverWindow || !popoverWindow.isVisible()) {
        showPopover(false);
      }
    });
  }

  // Right click shows context menu
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
  registerShortcuts();
  startNotchDetection();

  // Show on first launch
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
