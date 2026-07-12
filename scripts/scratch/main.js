const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Determine if we are running in development mode
const isDev = !app.isPackaged;

const LIVE_URL = 'https://erp.injaazh.com/';
const LOCAL_URL = 'http://localhost:3000';

const URL_TO_LOAD = LIVE_URL;

function createWindow() {
  // --- Create Splash Screen ---
  let splashWindow = new BrowserWindow({
    width: 500,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    icon: path.join(__dirname, 'public', 'favicon.ico'),
  });

  splashWindow.loadFile('splash.html');

  // --- Create Main Window ---
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    // Add an icon if you have one in the public folder
    icon: path.join(__dirname, 'public', 'favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      // You can add a preload script here if needed in the future
    },
    backgroundColor: '#1A1D24',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: 'rgba(0, 0, 0, 0)', // Completely transparent to show Next.js background
      symbolColor: '#ffffff',
      height: 45 // Slightly taller to cover the drag region well
    },
    show: false, // Wait until the app is fully loaded before showing
  });

  // Show the main window and destroy splash when ready
  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.show();
  });

  // Remove the ancient-looking File/Edit/View menu bar
  mainWindow.removeMenu();

  // Load the Next.js app URL with a standard Chrome User-Agent to prevent blocking
  mainWindow.loadURL(URL_TO_LOAD, {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  mainWindow.webContents.on('did-finish-load', () => {
    // Inject CSS to make the Next.js Topbar draggable and show the custom title bar only in Electron
    mainWindow.webContents.insertCSS(`
      /* Show the hidden title bar in Electron and make it draggable */
      #electron-titlebar {
        display: flex !important;
        -webkit-app-region: drag;
      }
      /* Push the entire app content down so it doesn't overlap with the title bar */
      body {
        padding-top: 35px !important;
      }
      /* Make sure inputs and buttons within the title bar (if any) are not draggable */
      #electron-titlebar button, #electron-titlebar input, #electron-titlebar a, .no-drag {
        -webkit-app-region: no-drag;
      }
    `);
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    // Ignore if it's the offline page itself failing
    if (validatedURL.includes('offline.html')) return;
    
    console.error('Failed to load URL:', errorDescription);
    mainWindow.loadURL(`file://${__dirname}/offline.html?error=${encodeURIComponent(errorDescription)}&code=${errorCode}`);
  });

  // Open the DevTools automatically if in development mode
  // Open the DevTools automatically if in development mode
  if (isDev) {
    // mainWindow.webContents.openDevTools();
  }
}

// Auto updater events
autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Available',
    message: 'A new version of Injaazh ERP is available. It is being downloaded in the background.'
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Ready',
    message: 'Update downloaded. The application will quit and install the update now.',
    buttons: ['Restart Now']
  }).then(() => {
    autoUpdater.quitAndInstall();
  });
});

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  // Check for updates automatically in production
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
