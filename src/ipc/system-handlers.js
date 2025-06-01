/**
 * System operation IPC handlers
 */
const { app } = require('electron');
const os = require('os');

/**
 * Register all system operation IPC handlers
 * @param {Electron.IpcMain} ipcMain - The Electron IpcMain instance
 * @param {Electron.BrowserWindow} mainWindow - The main application window
 */
function register(ipcMain, mainWindow) {
  // Handler for getting application version
  ipcMain.handle('app:version', async () => {
    return app.getVersion();
  });

  // Handler for getting system information
  ipcMain.handle('system:info', async () => {
    try {
      return {
        success: true,
        info: {
          platform: process.platform,
          arch: process.arch,
          node: process.version,
          electron: process.versions.electron,
          chrome: process.versions.chrome,
          os: {
            type: os.type(),
            release: os.release(),
            platform: os.platform(),
            arch: os.arch(),
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            cpus: os.cpus().length
          }
        }
      };
    } catch (error) {
      console.error('Error getting system info:', error);
      return { success: false, error: error.message };
    }
  });

  // Handle theme changes
  function setTheme(theme) {
    mainWindow.webContents.send('theme:changed', theme);
  }

  // Set initial theme based on system preferences (example)
  const isDarkMode = false; // This would be determined by system preferences
  setTheme(isDarkMode ? 'dark' : 'light');
}

module.exports = {
  register
};