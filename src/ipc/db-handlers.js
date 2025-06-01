/**
 * Database operation IPC handlers
 */
const {
  // Database management
  getDatabase,
  
  // App operations
  createApp,
  getAppById,
  updateApp,
  deleteApp,
  listApps,
  
  // Chat operations
  createChat,
  getChatById,
  updateChat,
  deleteChat,
  listChatsByAppId,
  
  // Message operations
  createMessage,
  getMessageById,
  updateMessage,
  listMessagesByChatId,
  
  // Language model provider operations
  createLanguageModelProvider,
  getLanguageModelProviderById,
  updateLanguageModelProvider,
  deleteLanguageModelProvider,
  listLanguageModelProviders,
  
  // Language model operations
  createLanguageModel,
  getLanguageModelById,
  updateLanguageModel,
  deleteLanguageModel,
  listLanguageModelsByProviderId,
  listAllLanguageModels,
  
  // Settings operations
  getSetting,
  setSetting,
  deleteSetting,
  listSettings,
  
  // Database utilities
  createDatabaseBackup,
  restoreDatabaseFromBackup
} = require('../db');

const {
  validateAppData,
  validateChatData,
  validateMessageData,
  validateProviderData,
  validateModelData
} = require('../lib/dbUtils');

/**
 * Register all database operation IPC handlers
 * @param {Electron.IpcMain} ipcMain - The Electron IpcMain instance
 * @param {Electron.BrowserWindow} mainWindow - The main application window
 */
function register(ipcMain, mainWindow) {
  // ========== App Handlers ==========
  
  // Handler for getting all apps
  ipcMain.handle('db:getApps', async (_, options) => {
    try {
      const apps = await listApps(options);
      return {
        success: true,
        apps
      };
    } catch (error) {
      console.error('Error getting apps:', error);
      return { success: false, error: error.message };
    }
  });

  // Handler for getting a specific app
  ipcMain.handle('db:getApp', async (_, id) => {
    try {
      const app = await getAppById(id);
      return {
        success: true,
        app
      };
    } catch (error) {
      console.error(`Error getting app ${id}:`, error);
      return { success: false, error: error.message };
    }
  });

  // Handler for creating/saving an app
  ipcMain.handle('db:saveApp', async (_, appData) => {
    try {
      // Validate app data
      const validation = validateAppData(appData);
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(', ') };
      }
      
      let app;
      if (appData.id) {
        // Update existing app
        app = await updateApp(appData.id, appData);
      } else {
        // Create new app
        app = await createApp(appData);
      }
      
      return {
        success: true,
        app
      };
    } catch (error) {
      console.error('Error saving app:', error);
      return { success: false, error: error.message };
    }
  });

  // Handler for deleting an app
  ipcMain.handle('db:deleteApp', async (_, id) => {
    try {
      await deleteApp(id);
      return { success: true };
    } catch (error) {
      console.error(`Error deleting app ${id}:`, error);
      return { success: false, error: error.message };
    }
  });
  
  // ========== Chat Handlers ==========
  
  // Handler for getting all chats for an app
  ipcMain.handle('db:getChatsByAppId', async (_, appId, options) => {
    try {
      const chats = await listChatsByAppId(appId, options);
      return {
        success: true,
        chats
      };
    } catch (error) {
      console.error(`Error getting chats for app ${appId}:`, error);
      return { success: false, error: error.message };
    }
  });

  // Handler for getting a specific chat
  ipcMain.handle('db:getChat', async (_, id) => {
    try {
      const chat = await getChatById(id);
      return {
        success: true,
        chat
      };
    } catch (error) {
      console.error(`Error getting chat ${id}:`, error);
      return { success: false, error: error.message };
    }
  });

  // Handler for creating/saving a chat
  ipcMain.handle('db:saveChat', async (_, chatData) => {
    try {
      // Validate chat data
      const validation = validateChatData(chatData);
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(', ') };
      }
      
      let chat;
      if (chatData.id) {
        // Update existing chat
        chat = await updateChat(chatData.id, chatData);
      } else {
        // Create new chat
        chat = await createChat(chatData);
      }
      
      return {
        success: true,
        chat
      };
    } catch (error) {
      console.error('Error saving chat:', error);
      return { success: false, error: error.message };
    }
  });

  // Handler for deleting a chat
  ipcMain.handle('db:deleteChat', async (_, id) => {
    try {
      await deleteChat(id);
      return { success: true };
    } catch (error) {
      console.error(`Error deleting chat ${id}:`, error);
      return { success: false, error: error.message };
    }
  });
  
  // ========== Message Handlers ==========
  
  // Handler for getting messages for a chat
  ipcMain.handle('db:getMessagesByChatId', async (_, chatId, options) => {
    try {
      const messages = await listMessagesByChatId(chatId, options);
      return {
        success: true,
        messages
      };
    } catch (error) {
      console.error(`Error getting messages for chat ${chatId}:`, error);
      return { success: false, error: error.message };
    }
  });

  // Handler for getting a specific message
  ipcMain.handle('db:getMessage', async (_, id) => {
    try {
      const message = await getMessageById(id);
      return {
        success: true,
        message
      };
    } catch (error) {
      console.error(`Error getting message ${id}:`, error);
      return { success: false, error: error.message };
    }
  });

  // Handler for creating/saving a message
  ipcMain.handle('db:saveMessage', async (_, messageData) => {
    try {
      // Validate message data
      const validation = validateMessageData(messageData);
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(', ') };
      }
      
      let message;
      if (messageData.id) {
        // Update existing message
        message = await updateMessage(messageData.id, messageData);
      } else {
        // Create new message
        message = await createMessage(messageData);
      }
      
      return {
        success: true,
        message
      };
    } catch (error) {
      console.error('Error saving message:', error);
      return { success: false, error: error.message };
    }
  });
  
  // ========== Language Model Provider Handlers ==========
  
  // Handler for getting all providers
  ipcMain.handle('db:getProviders', async (_, options) => {
    try {
      const providers = await listLanguageModelProviders(options);
      return {
        success: true,
        providers
      };
    } catch (error) {
      console.error('Error getting providers:', error);
      return { success: false, error: error.message };
    }
  });

  // Handler for getting a specific provider
  ipcMain.handle('db:getProvider', async (_, id, includeApiKey) => {
    try {
      const provider = await getLanguageModelProviderById(id, includeApiKey);
      return {
        success: true,
        provider
      };
    } catch (error) {
      console.error(`Error getting provider ${id}:`, error);
      return { success: false, error: error.message };
    }
  });

  // Handler for creating/saving a provider
  ipcMain.handle('db:saveProvider', async (_, providerData) => {
    try {
      // Validate provider data
      const validation = validateProviderData(providerData);
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(', ') };
      }
      
      let provider;
      if (providerData.id) {
        // Update existing provider
        provider = await updateLanguageModelProvider(providerData.id, providerData);
      } else {
        // Create new provider
        provider = await createLanguageModelProvider(providerData);
      }
      
      return {
        success: true,
        provider
      };
    } catch (error) {
      console.error('Error saving provider:', error);
      return { success: false, error: error.message };
    }
  });

  // Handler for deleting a provider
  ipcMain.handle('db:deleteProvider', async (_, id) => {
    try {
      await deleteLanguageModelProvider(id);
      return { success: true };
    } catch (error) {
      console.error(`Error deleting provider ${id}:`, error);
      return { success: false, error: error.message };
    }
  });
  
  // ========== Language Model Handlers ==========
  
  // Handler for getting models by provider
  ipcMain.handle('db:getModelsByProviderId', async (_, providerId, options) => {
    try {
      const models = await listLanguageModelsByProviderId(providerId, options);
      return {
        success: true,
        models
      };
    } catch (error) {
      console.error(`Error getting models for provider ${providerId}:`, error);
      return { success: false, error: error.message };
    }
  });
  
  // Handler for getting all models
  ipcMain.handle('db:getAllModels', async (_, options) => {
    try {
      const models = await listAllLanguageModels(options);
      return {
        success: true,
        models
      };
    } catch (error) {
      console.error('Error getting all models:', error);
      return { success: false, error: error.message };
    }
  });

  // Handler for getting a specific model
  ipcMain.handle('db:getModel', async (_, id) => {
    try {
      const model = await getLanguageModelById(id);
      return {
        success: true,
        model
      };
    } catch (error) {
      console.error(`Error getting model ${id}:`, error);
      return { success: false, error: error.message };
    }
  });

  // Handler for creating/saving a model
  ipcMain.handle('db:saveModel', async (_, modelData) => {
    try {
      // Validate model data
      const validation = validateModelData(modelData);
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(', ') };
      }
      
      let model;
      if (modelData.id) {
        // Update existing model
        model = await updateLanguageModel(modelData.id, modelData);
      } else {
        // Create new model
        model = await createLanguageModel(modelData);
      }
      
      return {
        success: true,
        model
      };
    } catch (error) {
      console.error('Error saving model:', error);
      return { success: false, error: error.message };
    }
  });

  // Handler for deleting a model
  ipcMain.handle('db:deleteModel', async (_, id) => {
    try {
      await deleteLanguageModel(id);
      return { success: true };
    } catch (error) {
      console.error(`Error deleting model ${id}:`, error);
      return { success: false, error: error.message };
    }
  });
  
  // ========== Settings Handlers ==========
  
  // Handler for getting a setting
  ipcMain.handle('db:getSetting', async (_, key) => {
    try {
      const setting = await getSetting(key);
      return {
        success: true,
        setting
      };
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error);
      return { success: false, error: error.message };
    }
  });

  // Handler for getting all settings
  ipcMain.handle('db:getAllSettings', async () => {
    try {
      const settings = await listSettings();
      return {
        success: true,
        settings
      };
    } catch (error) {
      console.error('Error getting all settings:', error);
      return { success: false, error: error.message };
    }
  });

  // Handler for setting a setting
  ipcMain.handle('db:setSetting', async (_, key, value) => {
    try {
      const setting = await setSetting(key, value);
      return {
        success: true,
        setting
      };
    } catch (error) {
      console.error(`Error setting setting ${key}:`, error);
      return { success: false, error: error.message };
    }
  });

  // Handler for deleting a setting
  ipcMain.handle('db:deleteSetting', async (_, key) => {
    try {
      await deleteSetting(key);
      return { success: true };
    } catch (error) {
      console.error(`Error deleting setting ${key}:`, error);
      return { success: false, error: error.message };
    }
  });
  
  // ========== Database Utility Handlers ==========
  
  // Handler for creating a database backup
  ipcMain.handle('db:createBackup', async () => {
    try {
      const backupPath = await createDatabaseBackup();
      return {
        success: true,
        backupPath
      };
    } catch (error) {
      console.error('Error creating database backup:', error);
      return { success: false, error: error.message };
    }
  });

  // Handler for restoring a database from backup
  ipcMain.handle('db:restoreFromBackup', async (_, backupPath) => {
    try {
      await restoreDatabaseFromBackup(backupPath);
      return { success: true };
    } catch (error) {
      console.error(`Error restoring database from backup ${backupPath}:`, error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  register
};