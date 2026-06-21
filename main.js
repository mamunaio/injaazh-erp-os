const { app, BrowserWindow } = require('electron');
const path = require('path');

// Determine if we are running in development mode
const isDev = !app.isPackaged;

// The URL of your live Vercel app
// When testing locally with npm run dev, it will connect to localhost:3000
const LIVE_URL = 'https://injaazh-erp-os.vercel.app/';
const LOCAL_URL = 'http://localhost:3000';

const URL_TO_LOAD = isDev ? LOCAL_URL : LIVE_URL;

function createWindow() {
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
      // You can add a preload script here if needed in the future
    },
    backgroundColor: '#1A1D24',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: 'rgba(0, 0, 0, 0)', // Completely transparent to show Next.js background
      symbolColor: '#ffffff',
      height: 35
    },
    show: true, // Show immediately so it feels fast
  });

  // Remove the ancient-looking File/Edit/View menu bar
  mainWindow.removeMenu();

  // Load the Next.js app URL with a standard Chrome User-Agent to prevent blocking
  mainWindow.loadURL(URL_TO_LOAD, {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load URL:', errorDescription);
    // You could load a local error HTML here instead of staying blank
  });

  // Open the DevTools automatically if in development mode
  if (isDev) {
    // mainWindow.webContents.openDevTools();
  }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

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
