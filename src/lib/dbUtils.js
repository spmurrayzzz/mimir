/**
 * Database utility functions
 */
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('sqlite3');

// Import database operations
const {
  getDatabase,
  initializeDatabase,
  withTransaction,
  createDatabaseBackup
} = require('../db');

/**
 * Validate a UUID
 * @param {string} id - The ID to validate
 * @returns {boolean} Whether the ID is a valid UUID
 */
function isValidUuid(id) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Sanitize a string for safe storage
 * @param {string} input - The input string to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(input) {
  if (typeof input !== 'string') {
    return input;
  }
  
  // Basic sanitization for demonstration purposes
  // In a real app, you might want a more robust solution
  return input
    .replace(/[^\w\s.,;:!?()[\]{}<>"'\/\\@#$%^&*+=\-_`~]/g, '')
    .trim();
}

/**
 * Validate app data
 * @param {Object} appData - App data to validate
 * @returns {Object} Validation result with isValid and errors
 */
function validateAppData(appData) {
  const errors = [];
  
  if (!appData.name) {
    errors.push('App name is required');
  }
  
  if (!appData.path) {
    errors.push('App path is required');
  }
  
  if (appData.name && appData.name.length > 255) {
    errors.push('App name must be less than 255 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate chat data
 * @param {Object} chatData - Chat data to validate
 * @returns {Object} Validation result with isValid and errors
 */
function validateChatData(chatData) {
  const errors = [];
  
  if (!chatData.app_id) {
    errors.push('App ID is required');
  } else if (!isValidUuid(chatData.app_id)) {
    errors.push('Invalid App ID format');
  }
  
  if (!chatData.name) {
    errors.push('Chat name is required');
  }
  
  if (chatData.name && chatData.name.length > 255) {
    errors.push('Chat name must be less than 255 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate message data
 * @param {Object} messageData - Message data to validate
 * @returns {Object} Validation result with isValid and errors
 */
function validateMessageData(messageData) {
  const errors = [];
  
  if (!messageData.chat_id) {
    errors.push('Chat ID is required');
  } else if (!isValidUuid(messageData.chat_id)) {
    errors.push('Invalid Chat ID format');
  }
  
  if (!messageData.role) {
    errors.push('Message role is required');
  } else if (!['user', 'assistant', 'system'].includes(messageData.role)) {
    errors.push('Invalid message role. Must be user, assistant, or system');
  }
  
  if (!messageData.content) {
    errors.push('Message content is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate language model provider data
 * @param {Object} providerData - Provider data to validate
 * @returns {Object} Validation result with isValid and errors
 */
function validateProviderData(providerData) {
  const errors = [];
  
  if (!providerData.name) {
    errors.push('Provider name is required');
  }
  
  if (!providerData.api_endpoint) {
    errors.push('API endpoint is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate language model data
 * @param {Object} modelData - Model data to validate
 * @returns {Object} Validation result with isValid and errors
 */
function validateModelData(modelData) {
  const errors = [];
  
  if (!modelData.provider_id) {
    errors.push('Provider ID is required');
  } else if (!isValidUuid(modelData.provider_id)) {
    errors.push('Invalid Provider ID format');
  }
  
  if (!modelData.model_name) {
    errors.push('Model name is required');
  }
  
  if (!modelData.display_name) {
    errors.push('Display name is required');
  }
  
  if (modelData.max_tokens && typeof modelData.max_tokens !== 'number') {
    errors.push('Max tokens must be a number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Perform database integrity check
 * @returns {Promise<Object>} Integrity check result
 */
async function checkDatabaseIntegrity() {
  if (!sqlite3) {
    throw new Error('SQLite3 not available');
  }
  
  const userDataPath = app.getPath('userData');
  const dbFilePath = path.join(userDataPath, 'mimir.sqlite');
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbFilePath);
    
    db.get('PRAGMA integrity_check', (err, result) => {
      db.close();
      
      if (err) {
        reject(err);
        return;
      }
      
      resolve({
        integrity: result.integrity_check === 'ok',
        details: result.integrity_check
      });
    });
  });
}

/**
 * Schedule automatic database backup
 * @param {number} intervalHours - Backup interval in hours
 * @returns {Object} Timer object for cancellation
 */
function scheduleAutomaticBackup(intervalHours = 24) {
  const intervalMs = intervalHours * 60 * 60 * 1000;
  
  // Create initial backup
  createDatabaseBackup().catch(err => {
    console.error('Failed to create initial database backup:', err);
  });
  
  // Schedule regular backups
  const timer = setInterval(async () => {
    try {
      await createDatabaseBackup();
      console.log(`Automatic database backup created (${new Date().toISOString()})`);
      
      // Clean up old backups (keep last 10)
      cleanupOldBackups(10);
    } catch (error) {
      console.error('Failed to create automatic database backup:', error);
    }
  }, intervalMs);
  
  return timer;
}

/**
 * Clean up old database backups
 * @param {number} keepCount - Number of recent backups to keep
 */
function cleanupOldBackups(keepCount = 10) {
  try {
    const userDataPath = app.getPath('userData');
    const backupDir = path.join(userDataPath, 'backups');
    
    if (!fs.existsSync(backupDir)) {
      return;
    }
    
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('mimir-backup-'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        time: fs.statSync(path.join(backupDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // Sort by time, newest first
    
    // Delete all but the most recent backups
    if (files.length > keepCount) {
      files.slice(keepCount).forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`Deleted old backup: ${file.name}`);
      });
    }
  } catch (error) {
    console.error('Failed to clean up old backups:', error);
  }
}

/**
 * Import data into the database
 * @param {Object} data - Data to import
 * @returns {Promise<boolean>} Success status
 */
async function importData(data) {
  try {
    await withTransaction(async (db) => {
      // Process apps
      if (data.apps && Array.isArray(data.apps)) {
        for (const app of data.apps) {
          // Check if app exists
          const existingApp = await db.select().from(apps).where(eq(apps.id, app.id));
          
          if (existingApp.length === 0) {
            await db.insert(apps).values(app);
          }
        }
      }
      
      // Process chats
      if (data.chats && Array.isArray(data.chats)) {
        for (const chat of data.chats) {
          // Check if chat exists
          const existingChat = await db.select().from(chats).where(eq(chats.id, chat.id));
          
          if (existingChat.length === 0) {
            await db.insert(chats).values(chat);
          }
        }
      }
      
      // Process messages
      if (data.messages && Array.isArray(data.messages)) {
        for (const message of data.messages) {
          // Check if message exists
          const existingMessage = await db.select().from(messages).where(eq(messages.id, message.id));
          
          if (existingMessage.length === 0) {
            await db.insert(messages).values(message);
          }
        }
      }
      
      // Process providers
      if (data.providers && Array.isArray(data.providers)) {
        for (const provider of data.providers) {
          // Check if provider exists
          const existingProvider = await db.select().from(language_model_providers)
            .where(eq(language_model_providers.id, provider.id));
          
          if (existingProvider.length === 0) {
            await db.insert(language_model_providers).values(provider);
          }
        }
      }
      
      // Process models
      if (data.models && Array.isArray(data.models)) {
        for (const model of data.models) {
          // Check if model exists
          const existingModel = await db.select().from(language_models)
            .where(eq(language_models.id, model.id));
          
          if (existingModel.length === 0) {
            await db.insert(language_models).values(model);
          }
        }
      }
    });
    
    return true;
  } catch (error) {
    console.error('Failed to import data:', error);
    throw error;
  }
}

/**
 * Export data from the database
 * @param {Object} options - Export options
 * @returns {Promise<Object>} Exported data
 */
async function exportData(options = {}) {
  try {
    const db = getDatabase();
    const exportedData = {};
    
    if (options.includeApps !== false) {
      exportedData.apps = await db.select().from(apps);
    }
    
    if (options.includeChats !== false) {
      exportedData.chats = await db.select().from(chats);
    }
    
    if (options.includeMessages !== false) {
      exportedData.messages = await db.select().from(messages);
    }
    
    if (options.includeProviders !== false) {
      exportedData.providers = await db.select().from(language_model_providers);
      
      // Remove sensitive data
      exportedData.providers.forEach(provider => {
        delete provider.api_key_encrypted;
      });
    }
    
    if (options.includeModels !== false) {
      exportedData.models = await db.select().from(language_models);
    }
    
    return exportedData;
  } catch (error) {
    console.error('Failed to export data:', error);
    throw error;
  }
}

module.exports = {
  // Validation functions
  isValidUuid,
  sanitizeString,
  validateAppData,
  validateChatData,
  validateMessageData,
  validateProviderData,
  validateModelData,
  
  // Database utilities
  checkDatabaseIntegrity,
  scheduleAutomaticBackup,
  cleanupOldBackups,
  
  // Data import/export
  importData,
  exportData
};