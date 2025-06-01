/**
 * AI Provider Factory
 * Creates and manages AI provider instances
 */

// Import providers
const OpenAIProvider = require('./providers/OpenAIProvider');
const AnthropicProvider = require('./providers/AnthropicProvider');
const GoogleAIProvider = require('./providers/GoogleAIProvider');
const OllamaProvider = require('./providers/OllamaProvider');
const LMStudioProvider = require('./providers/LMStudioProvider');

class ProviderFactory {
  constructor() {
    this.providers = {};
    this.defaultProvider = null;
  }

  /**
   * Initialize provider with configuration
   * @param {string} providerType - The provider type (openai, anthropic, google, ollama, lmstudio)
   * @param {Object} config - Provider configuration
   * @returns {Object} - The provider instance
   */
  async initializeProvider(providerType, config = {}) {
    let provider;

    switch (providerType.toLowerCase()) {
      case 'openai':
        provider = new OpenAIProvider(config);
        break;
      case 'anthropic':
        provider = new AnthropicProvider(config);
        break;
      case 'google':
        provider = new GoogleAIProvider(config);
        break;
      case 'ollama':
        provider = new OllamaProvider(config);
        break;
      case 'lmstudio':
        provider = new LMStudioProvider(config);
        break;
      default:
        throw new Error(`Unknown provider type: ${providerType}`);
    }

    try {
      await provider.connect();
      this.providers[providerType] = provider;
      
      // Set as default if no default exists or if specified in config
      if (!this.defaultProvider || config.isDefault) {
        this.defaultProvider = providerType;
      }
      
      return provider;
    } catch (error) {
      console.error(`Failed to initialize ${providerType} provider:`, error);
      throw error;
    }
  }

  /**
   * Get provider instance by type
   * @param {string} providerType - The provider type
   * @returns {Object} - The provider instance
   */
  getProvider(providerType) {
    if (!providerType && this.defaultProvider) {
      return this.providers[this.defaultProvider];
    }
    
    if (!this.providers[providerType]) {
      throw new Error(`Provider not initialized: ${providerType}`);
    }
    
    return this.providers[providerType];
  }

  /**
   * Get the default provider
   * @returns {Object} - The default provider instance
   */
  getDefaultProvider() {
    if (!this.defaultProvider) {
      throw new Error('No default provider set');
    }
    
    return this.providers[this.defaultProvider];
  }

  /**
   * Set the default provider
   * @param {string} providerType - The provider type to set as default
   */
  setDefaultProvider(providerType) {
    if (!this.providers[providerType]) {
      throw new Error(`Provider not initialized: ${providerType}`);
    }
    
    this.defaultProvider = providerType;
  }

  /**
   * Check if a provider is initialized
   * @param {string} providerType - The provider type
   * @returns {boolean} - Whether the provider is initialized
   */
  hasProvider(providerType) {
    return !!this.providers[providerType];
  }

  /**
   * Get all initialized providers
   * @returns {Object} - Map of provider type to provider instance
   */
  getAllProviders() {
    return this.providers;
  }

  /**
   * Get a list of all available provider types
   * @returns {Array<string>} - List of provider types
   */
  getAvailableProviderTypes() {
    return ['openai', 'anthropic', 'google', 'ollama', 'lmstudio'];
  }

  /**
   * Get usage statistics for all providers
   * @returns {Object} - Map of provider type to usage stats
   */
  getAllUsageStats() {
    const stats = {};
    
    for (const [type, provider] of Object.entries(this.providers)) {
      stats[type] = provider.getUsageStats();
    }
    
    return stats;
  }
}

module.exports = new ProviderFactory(); // Export as singleton