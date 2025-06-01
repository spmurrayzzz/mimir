/**
 * Base AI Provider Interface
 * All AI providers must implement this interface
 */

class BaseProvider {
  /**
   * Initialize the provider with configuration
   * @param {Object} config - Provider configuration
   */
  constructor(config = {}) {
    this.config = config;
    this.name = 'base';
    this.isConnected = false;
    this.supportedModels = [];
    this.usageStats = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      totalCost: 0
    };
  }

  /**
   * Connect to the AI provider
   * @returns {Promise<boolean>} - Connection success
   */
  async connect() {
    throw new Error('Method not implemented: connect()');
  }

  /**
   * Check if the provider is available and working
   * @returns {Promise<boolean>} - Provider health status
   */
  async checkHealth() {
    throw new Error('Method not implemented: checkHealth()');
  }

  /**
   * Generate a text completion
   * @param {string} prompt - The input prompt
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - The completion result
   */
  async generateCompletion(prompt, options = {}) {
    throw new Error('Method not implemented: generateCompletion()');
  }

  /**
   * Generate a streaming text completion
   * @param {string} prompt - The input prompt
   * @param {Object} options - Generation options
   * @param {function} onChunk - Callback for each chunk of the stream
   * @returns {Promise<Object>} - The completion result
   */
  async generateCompletionStream(prompt, options = {}, onChunk = () => {}) {
    throw new Error('Method not implemented: generateCompletionStream()');
  }

  /**
   * Get supported models for this provider
   * @returns {Array<string>} - List of supported model identifiers
   */
  getSupportedModels() {
    return this.supportedModels;
  }

  /**
   * Get usage statistics
   * @returns {Object} - Token usage and cost stats
   */
  getUsageStats() {
    return this.usageStats;
  }

  /**
   * Reset usage statistics
   */
  resetUsageStats() {
    this.usageStats = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      totalCost: 0
    };
  }

  /**
   * Update usage statistics
   * @param {Object} stats - Usage statistics to add
   */
  updateUsageStats(stats) {
    this.usageStats.promptTokens += stats.promptTokens || 0;
    this.usageStats.completionTokens += stats.completionTokens || 0;
    this.usageStats.totalTokens += stats.totalTokens || 0;
    this.usageStats.totalCost += stats.cost || 0;
  }

  /**
   * Estimate token count for a string
   * @param {string} text - The text to estimate tokens for
   * @returns {number} - Estimated token count
   */
  estimateTokenCount(text) {
    // Simple estimation: ~4 characters per token for English text
    return Math.ceil(text.length / 4);
  }
}

module.exports = BaseProvider;