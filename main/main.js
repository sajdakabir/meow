const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, nativeImage, Notification, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');

const isDev = process.env.ZEN_DEV === '1';
const DEV_URL = 'http://localhost:3456';
const OUT_DIR = path.join(__dirname, '..', 'renderer', 'out');

let mainWindow = null;
let tray = null;
let isQuitting = false;

// Mime type lookup
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.txt': 'text/plain',
  };
  return types[ext] || 'application/octet-stream';
}

// Register custom protocol to serve static files
function setupProtocol() {
  protocol.handle('app', (request) => {
    let reqPath = new URL(request.url).pathname;

    // Remove leading slash
    if (reqPath.startsWith('/')) {
      reqPath = reqPath.substring(1);
    }

    // Default to index.html
    if (!reqPath || reqPath === '') {
      reqPath = 'index.html';
    }

    const filePath = path.join(OUT_DIR, reqPath);

    // Security: ensure the resolved path is within OUT_DIR
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
    } catch (e) {
      // Fall through
    }

    return new Response('Not Found', { status: 404 });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 680,
    minWidth: 380,
    minHeight: 500,
    frame: false,
    transparent: false,
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    hasShadow: true,
    backgroundColor: '#0f1729',
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: -100, y: -100 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL(DEV_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Use custom protocol to serve static files (fixes /_next/ paths)
    mainWindow.loadURL('app://bundle/index.html');
  }

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('blur', () => {
    mainWindow.webContents.send('window-blur');
  });

  mainWindow.on('focus', () => {
    mainWindow.webContents.send('window-focus');
  });
}

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

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show/Hide',
      click: () => {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Start Focus',
      click: () => {
        mainWindow.show();
        mainWindow.webContents.send('tray-start-focus');
      },
    },
    {
      label: 'Pause',
      click: () => {
        mainWindow.webContents.send('tray-pause');
      },
    },
    {
      label: 'Reset',
      click: () => {
        mainWindow.webContents.send('tray-reset');
      },
    },
    { type: 'separator' },
    {
      label: 'Always on Top',
      type: 'checkbox',
      checked: true,
      click: (menuItem) => {
        mainWindow.setAlwaysOnTop(menuItem.checked);
      },
    },
    { type: 'separator' },
    {
      label: 'Quit Zen Focus',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function registerShortcuts() {
  globalShortcut.register('CommandOrControl+Shift+F', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// IPC Handlers
ipcMain.on('show-notification', (_, { title, body }) => {
  new Notification({ title, body }).show();
});

ipcMain.on('update-tray-title', (_, title) => {
  if (tray) {
    tray.setTitle(title);
  }
});

ipcMain.on('window-minimize', () => {
  mainWindow.hide();
});

ipcMain.on('window-close', () => {
  isQuitting = true;
  app.quit();
});

// App lifecycle
app.whenReady().then(() => {
  setupProtocol();
  createWindow();
  createTray();
  registerShortcuts();

  app.on('activate', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  globalShortcut.unregisterAll();
});
