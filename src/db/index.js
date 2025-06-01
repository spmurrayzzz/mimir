/**
 * Database setup and operations
 */
const { drizzle } = require('drizzle-orm/sqlite-proxy');
const { migrate } = require('drizzle-orm/sqlite-proxy/migrator');
const { eq, and, desc, asc } = require('drizzle-orm');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const sqlite3 = require('sqlite3');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Import schema definitions
const {
  apps,
  chats,
  messages,
  language_model_providers,
  language_models,
  settings
} = require('./schema');

// Database path in user data directory
const userDataPath = app.getPath('userData');
const dbFilePath = path.join(userDataPath, 'mimir.sqlite');
const dbBackupDir = path.join(userDataPath, 'backups');

// Database instance
let db = null;
let sqlite = null;

/**
 * Initialize the database connection
 */
async function initializeDatabase() {
  try {
    // Ensure directory exists
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    
    // Ensure backup directory exists
    if (!fs.existsSync(dbBackupDir)) {
      fs.mkdirSync(dbBackupDir, { recursive: true });
    }
    
    // Create SQLite connection
    sqlite = new sqlite3.Database(dbFilePath);
    
    // Enable foreign keys
    await new Promise((resolve, reject) => {
      sqlite.run('PRAGMA foreign_keys = ON;', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Create Drizzle ORM instance
    db = drizzle(sqlite);
    
    // Run migrations
    await runMigrations();
    
    console.log(`Database initialized at: ${dbFilePath}`);
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Run database migrations
 */
async function runMigrations() {
  try {
    // Migrations directory path
    const migrationsFolder = path.join(__dirname, '../../drizzle/migrations');
    
    // Run migrations if the folder exists
    if (fs.existsSync(migrationsFolder)) {
      await migrate(db, { migrationsFolder });
      console.log('Database migrations completed');
    } else {
      console.log('No migrations found. Skipping migration step.');
    }
  } catch (error) {
    console.error('Failed to run migrations:', error);
    throw error;
  }
}

/**
 * Get the database instance
 * @returns {Object} The Drizzle ORM database instance
 */
function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

/**
 * Close the database connection
 */
function closeDatabase() {
  if (sqlite) {
    sqlite.close();
    console.log('Database connection closed');
  }
}

/**
 * Execute a database operation in a transaction
 * @param {Function} operation - The database operation to execute
 * @returns {Promise<any>} The result of the operation
 */
async function withTransaction(operation) {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  return new Promise((resolve, reject) => {
    sqlite.run('BEGIN TRANSACTION;', async (err) => {
      if (err) return reject(err);
      
      try {
        const result = await operation(db);
        
        sqlite.run('COMMIT;', (err) => {
          if (err) {
            sqlite.run('ROLLBACK;', () => {
              reject(err);
            });
          } else {
            resolve(result);
          }
        });
      } catch (error) {
        sqlite.run('ROLLBACK;', () => {
          reject(error);
        });
      }
    });
  });
}

/**
 * Encrypt sensitive data
 * @param {string} data - Data to encrypt
 * @returns {Buffer} Encrypted data
 */
function encryptData(data) {
  // This is a placeholder for actual encryption
  // In a real implementation, you would use proper key management
  const key = crypto.scryptSync('encryption-key', 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  const encrypted = Buffer.concat([
    iv,
    cipher.update(data, 'utf8'),
    cipher.final()
  ]);
  
  return encrypted;
}

/**
 * Decrypt sensitive data
 * @param {Buffer} encryptedData - Data to decrypt
 * @returns {string} Decrypted data
 */
function decryptData(encryptedData) {
  // This is a placeholder for actual decryption
  // In a real implementation, you would use proper key management
  const key = crypto.scryptSync('encryption-key', 'salt', 32);
  const iv = encryptedData.slice(0, 16);
  const encryptedText = encryptedData.slice(16);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  
  const decrypted = Buffer.concat([
    decipher.update(encryptedText),
    decipher.final()
  ]).toString('utf8');
  
  return decrypted;
}

// ========== App Operations ==========

/**
 * Create a new app
 * @param {Object} appData - App data
 * @returns {Promise<Object>} Created app
 */
async function createApp(appData) {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  const now = new Date();
  const appId = uuidv4();
  
  const newApp = {
    id: appId,
    name: appData.name,
    path: appData.path,
    description: appData.description || null,
    created_at: now,
    updated_at: now
  };
  
  await db.insert(apps).values(newApp);
  return newApp;
}

/**
 * Get an app by ID
 * @param {string} appId - App ID
 * @returns {Promise<Object>} App data
 */
async function getAppById(appId) {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  const result = await db.select().from(apps).where(eq(apps.id, appId));
  return result[0] || null;
}

/**
 * Update an app
 * @param {string} appId - App ID
 * @param {Object} appData - Updated app data
 * @returns {Promise<Object>} Updated app
 */
async function updateApp(appId, appData) {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  const now = new Date();
  const updateData = {
    ...appData,
    updated_at: now
  };
  
  // Remove id from update data if present
  if (updateData.id) {
    delete updateData.id;
  }
  
  await db.update(apps)
    .set(updateData)
    .where(eq(apps.id, appId));
  
  return { ...updateData, id: appId };
}

/**
 * Delete an app
 * @param {string} appId - App ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteApp(appId) {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  await withTransaction(async (db) => {
    await db.delete(apps).where(eq(apps.id, appId));
  });
  
  return true;
}

/**
 * List all apps
 * @param {Object} options - Listing options (limit, offset, orderBy)
 * @returns {Promise<Array>} List of apps
 */
async function listApps(options = {}) {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  const { limit = 50, offset = 0, orderBy = 'updated_at', orderDir = 'desc' } = options;
  
  const query = db.select().from(apps);
  
  // Apply ordering
  if (orderBy && apps[orderBy]) {
    query.orderBy(orderDir === 'desc' ? desc(apps[orderBy]) : asc(apps[orderBy]));
  }
  
  // Apply pagination
  if (limit) {
    query.limit(limit);
  }
  
  if (offset) {
    query.offset(offset);
  }
  
  return await query;
}

// ========== Chat Operations ==========

/**
 * Create a new chat
 * @param {Object} chatData - Chat data
 * @returns {Promise<Object>} Created chat
 */
async function createChat(chatData) {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  const now = new Date();
  const chatId = uuidv4();
  
  const newChat = {
    id: chatId,
    app_id: chatData.app_id,
    name: chatData.name,
    created_at: now,
    updated_at: now
  };
  
  await db.insert(chats).values(newChat);
  return newChat;
}

/**
 * Get a chat by ID
 * @param {string} chatId - Chat ID
 * @returns {Promise<Object>} Chat data
 */
async function getChatById(chatId) {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  const result = await db.select().from(chats).where(eq(chats.id, chatId));
  return result[0] || null;
}

/**
 * Update a chat
 * @param {string} chatId - Chat ID
 * @param {Object} chatData - Updated chat data
 * @returns {Promise<Object>} Updated chat
 */
async function updateChat(chatId, chatData) {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  const now = new Date();
  const updateData = {
    ...chatData,
    updated_at: now
  };
  
  // Remove id from update data if present
  if (updateData.id) {
    delete updateData.id;
  }
  
  await db.update(chats)
    .set(updateData)
    .where(eq(chats.id, chatId));
  
  return { ...updateData, id: chatId };
}

/**
 * Delete a chat
 * @param {string} chatId - Chat ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteChat(chatId) {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  await withTransaction(async (db) => {
    await db.delete(chats).where(eq(chats.id, chatId));
  });
  
  return true;
}

/**
 * List chats by app ID
 * @param {string} appId - App ID
 * @param {Object} options - Listing options (limit, offset, orderBy)
 * @returns {Promise<Array>} List of chats
 */
async function listChatsByAppId(appId, options = {}) {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  const { limit = 50, offset = 0, orderBy = 'updated_at', orderDir = 'desc' } = options;
  
  const query = db.select().from(chats).where(eq(chats.app_id, appId));
  
  // Apply ordering
  if (orderBy && chats[orderBy]) {
    query.orderBy(orderDir === 'desc' ? desc(chats[orderBy]) : asc(chats[orderBy]));
  }
  
  // Apply pagination
  if (limit) {
    query.limit(limit);
  }
  
  if (offset) {
    query.offset(offset);
  }
  
  return await query;
}

// ========== Message Operations ==========

/**
 * Create a new message
 * @param {Object} messageData - Message data
 * @returns {Promise<Object>} Created message
 */
async function createMessage(messageData) {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  const messageId = uuidv4();
  const timestamp = messageData.timestamp || new Date();
  
  const newMessage = {
    id: messageId,
    chat_id: messageData.chat_id,
    role: messageData.role,
    content: messageData.content,
    timestamp: timestamp,
    code_actions: messageData.code_actions ? JSON.stringify(messageData.code_actions) : null,
    token_usage: messageData.token_usage ? JSON.stringify(messageData.token_usage) : null
  };
  
  await db.insert(messages).values(newMessage);
  
  // Update the chat's updated_at timestamp
  await db.update(chats)
    .set({ updated_at: timestamp })
    .where(eq(chats.id, messageData.chat_id));
  
  return {
    ...newMessage,
    code_actions: messageData.code_actions,
    token_usage: messageData.token_usage
  };
}

/**
 * Get a message by ID
 * @param {string} messageId - Message ID
 * @returns {Promise<Object>} Message data
 */
async function getMessageById(messageId) {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  const result = await db.select().from(messages).where(eq(messages.id, messageId));
  
  if (!result[0]) {
    return null;
  }
  
  // Parse JSON fields
  const message = result[0];
  if (message.code_actions) {
    try {
      message.code_actions = JSON.parse(message.code_actions);
    } catch (e) {
      console.error('Failed to parse code_actions:', e);
    }
  }
  
  if (message.token_usage) {
    try {
      message.token_usage = JSON.parse(message.token_usage);
    } catch (e) {
      console.error('Failed to parse token_usage:', e);
    }
  }
  
  return message;
}

/**
 * Update a message
 * @param {string} messageId - Message ID
 * @param {Object} messageData - Updated message data
 * @returns {Promise<Object>} Updated message
 */
async function updateMessage(messageId, messageData) {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  const updateData = { ...messageData };
  
  // Remove id from update data if present
  if (updateData.id) {
    delete updateData.id;
  }
  
  // Convert objects to JSON strings
  if (updateData.code_actions && typeof updateData.code_actions === 'object') {
    updateData.code_actions = JSON.stringify(updateData.code_actions);
  }
  
  if (updateData.token_usage && typeof updateData.token_usage === 'object') {
    updateData.token_usage = JSON.stringify(updateData.token_usage);
  }
  
  await db.update(messages)
    .set(updateData)
    .where(eq(messages.id, messageId));
  
  // Parse back for return value
  if (updateData.code_actions && typeof updateData.code_actions === 'string') {
    try {
      updateData.code_actions = JSON.parse(updateData.code_actions);
    } catch (e) {
      console.error('Failed to parse code_actions:', e);
    }
  }
  
  if (updateData.token_usage && typeof updateData.token_usage === 'string') {
    try {
      updateData.token_usage = JSON.parse(updateData.token_usage);
    } catch (e) {
      console.error('Failed to parse token_usage:', e);
    }
  }
  
  return { ...updateData, id: messageId };
}

/**
 * List messages by chat ID
 * @param {string} chatId - Chat ID
 * @param {Object} options - Listing options (limit, offset)
 * @returns {Promise<Array>} List of messages
 */
async function listMessagesByChatId(chatId, options = {}) {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  const { limit = 100, offset = 0, orderBy = 'timestamp', orderDir = 'asc' } = options;
  
  const query = db.select().from(messages).where(eq(messages.chat_id, chatId));
  
  // Apply ordering
  if (orderBy && messages[orderBy]) {
    query.orderBy(orderDir === 'desc' ? desc(messages[orderBy]) : asc(messages[orderBy]));
  }
  
  // Apply pagination
  if (limit) {
    query.limit(limit);
  }
  
  if (offset) {
    query.offset(offset);
  }
  
  const results = await query;
  
  // Parse JSON fields
  return results.map(message => {
    if (message.code_actions) {
      try {
        message.code_actions = JSON.parse(message.code_actions);
      } catch (e) {
        console.error('Failed to parse code_actions:', e);
      }
    }
    
    if (message.token_usage) {
      try {
        message.token_usage = JSON.parse(message.token_usage);
      } catch (e) {
        console.error('Failed to parse token_usage:', e);
      }
    }
    
    return message;
  });
}

// ========== Language Model Provider Operations ==========

/**
 * Create a new language model provider
 * @param {Object} providerData - Provider data
 * @returns {Promise<Object>} Created provider
 */
async function createLanguageModelProvider(providerData) {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  const providerId = uuidv4();
  const now = new Date();
  
  // Encrypt the API key if provided
  let apiKeyEncrypted = null;
  if (providerData.api_key) {
    apiKeyEncrypted = encryptData(providerData.api_key);
  }
  
  const newProvider = {
    id: providerId,
    name: providerData.name,
    api_endpoint: providerData.api_endpoint,
    api_key_encrypted: apiKeyEncrypted,
    is_active: providerData.is_active !== undefined ? providerData.is_active : true,
    created_at: now
  };
  
  await db.insert(language_model_providers).values(newProvider);
  
  // Don't include the API key in the returned data
  const { api_key_encrypted, ...returnData } = newProvider;
  return returnData;
}

/**
 * Get a language model provider by ID
 * @param {string} providerId - Provider ID
 * @param {boolean} includeApiKey - Whether to include the decrypted API key
 * @returns {Promise<Object>} Provider data
 */
async function getLanguageModelProviderById(providerId, includeApiKey = false) {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  const result = await db.select().from(language_model_providers)
    .where(eq(language_model_providers.id, providerId));
  
  if (!result[0]) {
    return null;
  }
  
  const provider = { ...result[0] };
  
  if (includeApiKey && provider.api_key_encrypted) {
    try {
      provider.api_key = decryptData(provider.api_key_encrypted);
    } catch (e) {
      console.error('Failed to decrypt API key:', e);
    }
  }
  
  // Don't include the encrypted API key in the returned data
  delete provider.api_key_encrypted;
  
  return provider;
}

/**
 * Update a language model provider
 * @param {string} providerId - Provider ID
 * @param {Object} providerData - Updated provider data
 * @returns {Promise<Object>} Updated provider
 */
async function updateLanguageModelProvider(providerId, providerData) {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  const updateData = { ...providerData };
  
  // Remove id from update data if present
  if (updateData.id) {
    delete updateData.id;
  }
  
  // Encrypt the API key if provided
  if (updateData.api_key) {
    updateData.api_key_encrypted = encryptData(updateData.api_key);
    delete updateData.api_key;
  }
  
  await db.update(language_model_providers)
    .set(updateData)
    .where(eq(language_model_providers.id, providerId));
  
  // Don't include the API key in the returned data
  const { api_key_encrypted, ...returnData } = updateData;
  return { ...returnData, id: providerId };
}

/**
 * Delete a language model provider
 * @param {string} providerId - Provider ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteLanguageModelProvider(providerId) {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  await withTransaction(async (db) => {
    await db.delete(language_model_providers).where(eq(language_model_providers.id, providerId));
  });
  
  return true;
}

/**
 * List all language model providers
 * @param {Object} options - Listing options (includeInactive)
 * @returns {Promise<Array>} List of providers
 */
async function listLanguageModelProviders(options = {}) {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  const { includeInactive = false } = options;
  
  let query = db.select().from(language_model_providers);
  
  if (!includeInactive) {
    query = query.where(eq(language_model_providers.is_active, true));
  }
  
  const results = await query;
  
  // Don't include the API keys in the returned data
  return results.map(provider => {
    const { api_key_encrypted, ...returnData } = provider;
    return returnData;
  });
}

// ========== Language Model Operations ==========

/**
 * Create a new language model
 * @param {Object} modelData - Model data
 * @returns {Promise<Object>} Created model
 */
async function createLanguageModel(modelData) {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  const modelId = uuidv4();
  
  const newModel = {
    id: modelId,
    provider_id: modelData.provider_id,
    model_name: modelData.model_name,
    display_name: modelData.display_name,
    max_tokens: modelData.max_tokens || null,
    cost_per_token: modelData.cost_per_token || null,
    is_active: modelData.is_active !== undefined ? modelData.is_active : true
  };
  
  await db.insert(language_models).values(newModel);
  return newModel;
}

/**
 * Get a language model by ID
 * @param {string} modelId - Model ID
 * @returns {Promise<Object>} Model data
 */
async function getLanguageModelById(modelId) {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  const result = await db.select().from(language_models).where(eq(language_models.id, modelId));
  return result[0] || null;
}

/**
 * Update a language model
 * @param {string} modelId - Model ID
 * @param {Object} modelData - Updated model data
 * @returns {Promise<Object>} Updated model
 */
async function updateLanguageModel(modelId, modelData) {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  const updateData = { ...modelData };
  
  // Remove id from update data if present
  if (updateData.id) {
    delete updateData.id;
  }
  
  await db.update(language_models)
    .set(updateData)
    .where(eq(language_models.id, modelId));
  
  return { ...updateData, id: modelId };
}

/**
 * Delete a language model
 * @param {string} modelId - Model ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteLanguageModel(modelId) {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  await db.delete(language_models).where(eq(language_models.id, modelId));
  return true;
}

/**
 * List language models by provider ID
 * @param {string} providerId - Provider ID
 * @param {Object} options - Listing options (includeInactive)
 * @returns {Promise<Array>} List of models
 */
async function listLanguageModelsByProviderId(providerId, options = {}) {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  const { includeInactive = false } = options;
  
  let query = db.select().from(language_models)
    .where(eq(language_models.provider_id, providerId));
  
  if (!includeInactive) {
    query = query.where(eq(language_models.is_active, true));
  }
  
  return await query;
}

/**
 * List all language models
 * @param {Object} options - Listing options (includeInactive)
 * @returns {Promise<Array>} List of models
 */
async function listAllLanguageModels(options = {}) {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  const { includeInactive = false } = options;
  
  let query = db.select({
    model: language_models,
    provider_name: language_model_providers.name
  })
    .from(language_models)
    .leftJoin(
      language_model_providers,
      eq(language_models.provider_id, language_model_providers.id)
    );
  
  if (!includeInactive) {
    query = query.where(
      and(
        eq(language_models.is_active, true),
        eq(language_model_providers.is_active, true)
      )
    );
  }
  
  const results = await query;
  
  // Format the results
  return results.map(row => ({
    ...row.model,
    provider_name: row.provider_name
  }));
}

// ========== Settings Operations ==========

/**
 * Get a setting by key
 * @param {string} key - Setting key
 * @returns {Promise<Object>} Setting data
 */
async function getSetting(key) {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  const result = await db.select().from(settings).where(eq(settings.key, key));
  
  if (!result[0]) {
    return null;
  }
  
  const setting = result[0];
  if (setting.value) {
    try {
      setting.value = JSON.parse(setting.value);
    } catch (e) {
      console.error(`Failed to parse setting value for key ${key}:`, e);
    }
  }
  
  return setting;
}

/**
 * Set a setting
 * @param {string} key - Setting key
 * @param {any} value - Setting value
 * @returns {Promise<Object>} Setting data
 */
async function setSetting(key, value) {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  const now = new Date();
  const stringValue = JSON.stringify(value);
  
  // Check if the setting already exists
  const existing = await getSetting(key);
  
  if (existing) {
    // Update
    await db.update(settings)
      .set({
        value: stringValue,
        updated_at: now
      })
      .where(eq(settings.key, key));
  } else {
    // Insert
    await db.insert(settings).values({
      key,
      value: stringValue,
      updated_at: now
    });
  }
  
  return {
    key,
    value,
    updated_at: now
  };
}

/**
 * Delete a setting
 * @param {string} key - Setting key
 * @returns {Promise<boolean>} Success status
 */
async function deleteSetting(key) {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  await db.delete(settings).where(eq(settings.key, key));
  return true;
}

/**
 * List all settings
 * @returns {Promise<Array>} List of settings
 */
async function listSettings() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  const results = await db.select().from(settings);
  
  return results.map(setting => {
    if (setting.value) {
      try {
        setting.value = JSON.parse(setting.value);
      } catch (e) {
        console.error(`Failed to parse setting value for key ${setting.key}:`, e);
      }
    }
    return setting;
  });
}

// ========== Database Utilities ==========

/**
 * Create a database backup
 * @returns {Promise<string>} Backup file path
 */
async function createDatabaseBackup() {
  if (!sqlite) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilePath = path.join(dbBackupDir, `mimir-backup-${timestamp}.sqlite`);
  
  return new Promise((resolve, reject) => {
    const backupDb = new sqlite3.Database(backupFilePath);
    
    sqlite.backup(backupDb, (err) => {
      backupDb.close();
      
      if (err) {
        reject(err);
      } else {
        console.log(`Database backup created at: ${backupFilePath}`);
        resolve(backupFilePath);
      }
    });
  });
}

/**
 * Restore database from backup
 * @param {string} backupFilePath - Path to backup file
 * @returns {Promise<boolean>} Success status
 */
async function restoreDatabaseFromBackup(backupFilePath) {
  if (!fs.existsSync(backupFilePath)) {
    throw new Error(`Backup file not found: ${backupFilePath}`);
  }
  
  // Close current connection
  if (sqlite) {
    sqlite.close();
  }
  
  // Backup the current database first
  const currentBackupPath = path.join(
    dbBackupDir, 
    `mimir-pre-restore-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`
  );
  
  try {
    fs.copyFileSync(dbFilePath, currentBackupPath);
    console.log(`Current database backed up to: ${currentBackupPath}`);
    
    // Replace the current database with the backup
    fs.copyFileSync(backupFilePath, dbFilePath);
    console.log(`Database restored from: ${backupFilePath}`);
    
    // Reinitialize the database connection
    await initializeDatabase();
    
    return true;
  } catch (error) {
    console.error('Failed to restore database:', error);
    throw error;
  }
}

// Export all functions
module.exports = {
  // Database management
  initializeDatabase,
  getDatabase,
  closeDatabase,
  runMigrations,
  withTransaction,
  
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
  restoreDatabaseFromBackup,
  
  // Encryption utilities
  encryptData,
  decryptData
};