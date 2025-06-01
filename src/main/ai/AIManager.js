/**
 * AI Manager
 * Central coordination point for AI functionality
 */

const ProviderFactory = require('./ProviderFactory');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const os = require('os');

class AIManager {
  constructor() {
    this.providerFactory = ProviderFactory;
    this.conversations = new Map();
    this.defaultProvider = null;
    this.keyEncryptionKey = null;
    
    // Storage for API keys
    this.keyStoragePath = path.join(os.homedir(), '.mimir', 'keys.json');
    
    // Create storage directory if it doesn't exist
    const storageDir = path.dirname(this.keyStoragePath);
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
  }

  /**
   * Initialize the AI system
   * @param {Object} settings - AI settings
   * @returns {Promise<boolean>} - Initialization success
   */
  async initialize(settings = {}) {
    try {
      console.log('Initializing AI system with settings:', settings);
      
      // Initialize encryption for API keys
      await this.initializeKeyEncryption();
      
      // Load saved API keys
      const apiKeys = await this.loadApiKeys();
      
      // Initialize configured providers
      if (settings.providers) {
        for (const [providerType, config] of Object.entries(settings.providers)) {
          if (config.enabled) {
            // Add API key to config if available
            const providerConfig = { ...config };
            if (apiKeys[providerType]) {
              providerConfig.apiKey = apiKeys[providerType];
            }
            
            try {
              await this.providerFactory.initializeProvider(providerType, providerConfig);
              console.log(`Initialized ${providerType} provider`);
            } catch (error) {
              console.error(`Failed to initialize ${providerType} provider:`, error);
            }
          }
        }
      }
      
      // Set default provider
      if (settings.defaultProvider && this.providerFactory.hasProvider(settings.defaultProvider)) {
        this.defaultProvider = settings.defaultProvider;
        this.providerFactory.setDefaultProvider(settings.defaultProvider);
      } else {
        // Try to set a fallback default provider
        const availableProviders = Object.keys(this.providerFactory.getAllProviders());
        if (availableProviders.length > 0) {
          this.defaultProvider = availableProviders[0];
          this.providerFactory.setDefaultProvider(this.defaultProvider);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing AI system:', error);
      return false;
    }
  }

  /**
   * Initialize key encryption system
   * @returns {Promise<void>}
   */
  async initializeKeyEncryption() {
    try {
      // Use a fixed key for development purposes
      // In production, this would be replaced with a more secure approach
      // such as using the system keychain or a user-provided password
      this.keyEncryptionKey = crypto.scryptSync('mimir-app-secret', 'salt', 32);
    } catch (error) {
      console.error('Error initializing key encryption:', error);
      throw error;
    }
  }

  /**
   * Encrypt an API key
   * @param {string} apiKey - The API key to encrypt
   * @returns {string} - Encrypted API key
   */
  encryptApiKey(apiKey) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', this.keyEncryptionKey, iv);
      let encrypted = cipher.update(apiKey, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag();
      
      // Store IV and auth tag with the encrypted data
      return JSON.stringify({
        iv: iv.toString('hex'),
        encrypted,
        tag: authTag.toString('hex')
      });
    } catch (error) {
      console.error('Error encrypting API key:', error);
      throw error;
    }
  }

  /**
   * Decrypt an API key
   * @param {string} encryptedData - The encrypted API key data
   * @returns {string} - Decrypted API key
   */
  decryptApiKey(encryptedData) {
    try {
      const data = JSON.parse(encryptedData);
      const iv = Buffer.from(data.iv, 'hex');
      const encrypted = data.encrypted;
      const authTag = Buffer.from(data.tag, 'hex');
      
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.keyEncryptionKey, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Error decrypting API key:', error);
      throw error;
    }
  }

  /**
   * Save API keys to secure storage
   * @param {Object} apiKeys - Map of provider types to API keys
   * @returns {Promise<boolean>} - Save success
   */
  async saveApiKeys(apiKeys) {
    try {
      const encryptedKeys = {};
      
      // Encrypt each API key
      for (const [provider, key] of Object.entries(apiKeys)) {
        encryptedKeys[provider] = this.encryptApiKey(key);
      }
      
      // Save to file
      fs.writeFileSync(this.keyStoragePath, JSON.stringify(encryptedKeys), 'utf8');
      return true;
    } catch (error) {
      console.error('Error saving API keys:', error);
      return false;
    }
  }

  /**
   * Load API keys from secure storage
   * @returns {Promise<Object>} - Map of provider types to API keys
   */
  async loadApiKeys() {
    try {
      if (!fs.existsSync(this.keyStoragePath)) {
        return {};
      }
      
      const encryptedKeys = JSON.parse(fs.readFileSync(this.keyStoragePath, 'utf8'));
      const decryptedKeys = {};
      
      // Decrypt each API key
      for (const [provider, encryptedKey] of Object.entries(encryptedKeys)) {
        try {
          decryptedKeys[provider] = this.decryptApiKey(encryptedKey);
        } catch (decryptError) {
          console.error(`Error decrypting key for ${provider}:`, decryptError);
        }
      }
      
      return decryptedKeys;
    } catch (error) {
      console.error('Error loading API keys:', error);
      return {};
    }
  }

  /**
   * Set an API key for a provider
   * @param {string} providerType - The provider type
   * @param {string} apiKey - The API key
   * @returns {Promise<boolean>} - Success
   */
  async setApiKey(providerType, apiKey) {
    try {
      // Load existing keys
      const apiKeys = await this.loadApiKeys();
      
      // Update the key
      apiKeys[providerType] = apiKey;
      
      // Save updated keys
      await this.saveApiKeys(apiKeys);
      
      // Update the provider configuration if it exists
      if (this.providerFactory.hasProvider(providerType)) {
        const provider = this.providerFactory.getProvider(providerType);
        provider.config.apiKey = apiKey;
        
        // Reconnect the provider with the new key
        await provider.connect();
      }
      
      return true;
    } catch (error) {
      console.error(`Error setting API key for ${providerType}:`, error);
      return false;
    }
  }

  /**
   * Delete an API key for a provider
   * @param {string} providerType - The provider type
   * @returns {Promise<boolean>} - Success
   */
  async deleteApiKey(providerType) {
    try {
      // Load existing keys
      const apiKeys = await this.loadApiKeys();
      
      // Delete the key
      delete apiKeys[providerType];
      
      // Save updated keys
      await this.saveApiKeys(apiKeys);
      
      return true;
    } catch (error) {
      console.error(`Error deleting API key for ${providerType}:`, error);
      return false;
    }
  }

  /**
   * Get a provider by type
   * @param {string} providerType - The provider type
   * @returns {Object} - The provider
   */
  getProvider(providerType) {
    return this.providerFactory.getProvider(providerType);
  }

  /**
   * Get the default provider
   * @returns {Object} - The default provider
   */
  getDefaultProvider() {
    return this.providerFactory.getDefaultProvider();
  }

  /**
   * Set the default provider
   * @param {string} providerType - The provider type
   * @returns {boolean} - Success
   */
  setDefaultProvider(providerType) {
    try {
      this.providerFactory.setDefaultProvider(providerType);
      this.defaultProvider = providerType;
      return true;
    } catch (error) {
      console.error(`Error setting default provider to ${providerType}:`, error);
      return false;
    }
  }

  /**
   * Get all available providers
   * @returns {Object} - Map of provider types to provider instances
   */
  getAllProviders() {
    return this.providerFactory.getAllProviders();
  }

  /**
   * Check provider health
   * @param {string} providerType - The provider type
   * @returns {Promise<boolean>} - Provider health status
   */
  async checkProviderHealth(providerType) {
    try {
      const provider = this.providerFactory.getProvider(providerType);
      return await provider.checkHealth();
    } catch (error) {
      console.error(`Error checking health for ${providerType}:`, error);
      return false;
    }
  }

  /**
   * Get usage statistics for all providers
   * @returns {Object} - Map of provider types to usage stats
   */
  getUsageStats() {
    return this.providerFactory.getAllUsageStats();
  }

  /**
   * Reset usage statistics for all providers
   * @returns {boolean} - Success
   */
  resetUsageStats() {
    try {
      const providers = this.providerFactory.getAllProviders();
      for (const provider of Object.values(providers)) {
        provider.resetUsageStats();
      }
      return true;
    } catch (error) {
      console.error('Error resetting usage stats:', error);
      return false;
    }
  }
}

module.exports = new AIManager(); // Export as singleton