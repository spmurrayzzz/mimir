const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { initialize: initializeIPC } = require('../ipc');

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow = null;

const createWindow = () => {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../../electron/preload.js'),
    },
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools in development mode
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the bundled index.html
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  // Initialize IPC handlers
  initializeIPC(ipcMain, mainWindow);
};

// Create window when Electron is ready
app.whenReady().then(() => {
  createWindow();

  // On macOS, re-create a window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});