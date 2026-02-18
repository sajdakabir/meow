const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, nativeImage, Notification, protocol, screen } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.ZEN_DEV === '1';
const DEV_URL = 'http://localhost:3456';
const OUT_DIR = path.join(__dirname, '..', 'renderer', 'out');

let popoverWindow = null;
let tray = null;
let isQuitting = false;

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

// ── Position window below the tray icon (menubar popover style) ──
function getPopoverPosition() {
  const trayBounds = tray.getBounds();
  const windowBounds = popoverWindow.getBounds();
  const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y });

  let x = Math.round(trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2);
  let y = Math.round(trayBounds.y + trayBounds.height + 4);

  // Keep within screen bounds
  const maxX = display.workArea.x + display.workArea.width - windowBounds.width;
  const maxY = display.workArea.y + display.workArea.height - windowBounds.height;
  x = Math.max(display.workArea.x, Math.min(x, maxX));
  y = Math.min(y, maxY);

  return { x, y };
}

function showPopover() {
  if (!popoverWindow) return;
  const { x, y } = getPopoverPosition();
  popoverWindow.setPosition(x, y, false);
  popoverWindow.show();
  popoverWindow.focus();
}

function hidePopover() {
  if (popoverWindow) popoverWindow.hide();
}

function togglePopover() {
  if (popoverWindow && popoverWindow.isVisible()) {
    hidePopover();
  } else {
    showPopover();
  }
}

// ── Create the popover window ──
function createPopoverWindow() {
  popoverWindow = new BrowserWindow({
    width: 360,
    height: 420,
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

  // Hide when focus is lost (like a real popover)
  popoverWindow.on('blur', () => {
    // Small delay to allow clicking tray icon to toggle
    setTimeout(() => {
      if (popoverWindow && !popoverWindow.isDestroyed() && !popoverWindow.isFocused()) {
        hidePopover();
      }
    }, 150);
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

  // Right click shows context menu
  tray.on('right-click', () => {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Start Timer (25 min)',
        accelerator: 'CommandOrControl+T',
        click: () => {
          showPopover();
          popoverWindow.webContents.send('tray-start-focus');
        },
      },
      { type: 'separator' },
      {
        label: 'Settings...',
        accelerator: 'CommandOrControl+,',
        click: () => {
          showPopover();
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
  globalShortcut.register('CommandOrControl+T', () => {
    showPopover();
    popoverWindow.webContents.send('tray-start-focus');
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
  if (popoverWindow) {
    const bounds = popoverWindow.getBounds();
    popoverWindow.setBounds({ x: bounds.x, y: bounds.y, width: bounds.width, height });
  }
});

// ── App lifecycle ──
app.dock && app.dock.hide(); // Hide from dock — menubar-only app

app.whenReady().then(() => {
  setupProtocol();
  createTray();
  createPopoverWindow();
  registerShortcuts();

  // Show on first launch
  setTimeout(() => showPopover(), 500);

  app.on('activate', () => showPopover());
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  isQuitting = true;
  globalShortcut.unregisterAll();
});
