/**
 * File operation IPC handlers
 */
const { dialog } = require('electron');
const fs = require('fs');
const path = require('path');

/**
 * Register all file operation IPC handlers
 * @param {Electron.IpcMain} ipcMain - The Electron IpcMain instance
 * @param {Electron.BrowserWindow} mainWindow - The main application window
 */
function register(ipcMain, mainWindow) {
  // Handler for opening files
  ipcMain.handle('file:open', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
          { name: 'Text Files', extensions: ['txt', 'js', 'ts', 'jsx', 'tsx', 'vue', 'json', 'md'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      
      if (canceled || filePaths.length === 0) {
        return { canceled: true };
      }
      
      const filePath = filePaths[0];
      const content = fs.readFileSync(filePath, 'utf8');
      return { 
        canceled: false, 
        filePath, 
        content,
        fileName: path.basename(filePath)
      };
    } catch (error) {
      console.error('Error opening file:', error);
      return { canceled: true, error: error.message };
    }
  });

  // Handler for saving files
  ipcMain.handle('file:save', async (_, content) => {
    // Placeholder for file saving logic
    console.log('Save file handler called');
    return { success: true };
  });

  // Handler for "Save As" operation
  ipcMain.handle('file:saveAs', async (_, content) => {
    // Placeholder for "Save As" logic
    console.log('Save As handler called');
    return { success: true };
  });
}

module.exports = {
  register
};