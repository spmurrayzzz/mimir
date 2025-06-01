/**
 * IPC handler initialization
 * This module sets up all IPC communication between the main and renderer processes
 */

const fileHandlers = require('./file-handlers');
const dbHandlers = require('./db-handlers');
const aiHandlers = require('./ai-handlers');
const systemHandlers = require('./system-handlers');

/**
 * Initialize all IPC handlers
 * @param {Electron.IpcMain} ipcMain - The Electron IpcMain instance
 * @param {Electron.BrowserWindow} mainWindow - The main application window
 */
function initialize(ipcMain, mainWindow) {
  // Register file operation handlers
  fileHandlers.register(ipcMain, mainWindow);
  
  // Register database operation handlers
  dbHandlers.register(ipcMain, mainWindow);
  
  // Register AI operation handlers
  aiHandlers.register(ipcMain, mainWindow);
  
  // Register system operation handlers
  systemHandlers.register(ipcMain, mainWindow);
  
  console.log('All IPC handlers registered');
}

module.exports = {
  initialize
};