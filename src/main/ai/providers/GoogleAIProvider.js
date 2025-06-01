/**
 * Google AI Provider Implementation
 */

const BaseProvider = require('../BaseProvider');
const { GoogleGenerativeAI } = require('@ai-sdk/provider-google');
const { createAI } = require('@ai-sdk/fetch');

class GoogleAIProvider extends BaseProvider {
  /**
   * Initialize the Google AI provider
   * @param {Object} config - Provider configuration
   */
  constructor(config = {}) {
    super(config);
    this.name = 'google';
    this.supportedModels = [
      'gemini-1.5-pro-latest',
      'gemini-1.5-flash-latest',
      'gemini-1.0-pro',
      'gemini-1.0-pro-vision'
    ];
    
    // Cost per 1000 tokens in USD by model
    this.costs = {
      'gemini-1.5-pro-latest': { input: 0.0005, output: 0.0015 },
      'gemini-1.5-flash-latest': { input: 0.00025, output: 0.0005 },
      'gemini-1.0-pro': { input: 0.00025, output: 0.0005 },
      'gemini-1.0-pro-vision': { input: 0.0005, output: 0.0015 }
    };
    
    this.client = null;
    this.defaultModel = config.defaultModel || 'gemini-1.0-pro';
    this.maxRetries = config.maxRetries || 3;
  }

  /**
   * Connect to the Google AI API
   * @returns {Promise<boolean>} - Connection success
   */
  async connect() {
    try {
      if (!this.config.apiKey) {
        throw new Error('Google AI API key is required');
      }

      const provider = new GoogleGenerativeAI({
        apiKey: this.config.apiKey
      });

      this.client = createAI({
        provider
      });

      this.isConnected = true;
      console.log('Connected to Google AI API successfully');
      return true;
    } catch (error) {
      console.error('Failed to connect to Google AI API:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Check if the provider is available and working
   * @returns {Promise<boolean>} - Provider health status
   */
  async checkHealth() {
    try {
      if (!this.isConnected || !this.client) {
        await this.connect();
      }
      
      // Simple model validation to check if the API is working
      const result = await this.generateCompletion('Hello, are you working?', {
        model: this.defaultModel,
        maxTokens: 5
      });
      
      return result && result.success;
    } catch (error) {
      console.error('Google AI health check failed:', error);
      return false;
    }
  }

  /**
   * Generate a text completion with retry logic
   * @param {string} prompt - The input prompt
   * @param {Object} options - Generation options
   * @param {number} retryCount - Current retry attempt
   * @returns {Promise<Object>} - The completion result
   */
  async generateCompletion(prompt, options = {}, retryCount = 0) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const model = options.model || this.defaultModel;
      const maxTokens = options.maxTokens || 1024;
      const temperature = options.temperature || 0.7;
      
      const result = await this.client.run({
        messages: [{ role: 'user', content: prompt }],
        model,
        max_tokens: maxTokens,
        temperature
      });
      
      // Calculate token usage
      const promptTokens = this.estimateTokenCount(prompt);
      const completionTokens = this.estimateTokenCount(result.message.content);
      const totalTokens = promptTokens + completionTokens;
      
      // Calculate cost
      const modelCosts = this.costs[model] || { input: 0.0005, output: 0.0015 };
      const cost = (
        (promptTokens / 1000) * modelCosts.input +
        (completionTokens / 1000) * modelCosts.output
      );
      
      // Update usage stats
      this.updateUsageStats({
        promptTokens,
        completionTokens,
        totalTokens,
        cost
      });

      return {
        success: true,
        completion: result.message.content,
        model,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens,
          cost
        }
      };
    } catch (error) {
      console.error(`Google AI completion error (attempt ${retryCount + 1}):`, error);
      
      // Retry logic for certain errors
      if (retryCount < this.maxRetries && this.shouldRetry(error)) {
        console.log(`Retrying Google AI completion (attempt ${retryCount + 2})`);
        // Exponential backoff: 1s, 2s, 4s, etc.
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.generateCompletion(prompt, options, retryCount + 1);
      }
      
      return {
        success: false,
        error: error.message,
        model: options.model || this.defaultModel
      };
    }
  }

  /**
   * Generate a streaming text completion with retry logic
   * @param {string} prompt - The input prompt
   * @param {Object} options - Generation options
   * @param {function} onChunk - Callback for each chunk of the stream
   * @param {number} retryCount - Current retry attempt
   * @returns {Promise<Object>} - The completion result
   */
  async generateCompletionStream(prompt, options = {}, onChunk = () => {}, retryCount = 0) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const model = options.model || this.defaultModel;
      const maxTokens = options.maxTokens || 1024;
      const temperature = options.temperature || 0.7;
      
      let fullCompletion = '';
      
      const stream = await this.client.run.stream({
        messages: [{ role: 'user', content: prompt }],
        model,
        max_tokens: maxTokens,
        temperature
      });
      
      for await (const chunk of stream) {
        if (chunk.message?.content) {
          fullCompletion += chunk.message.content;
          onChunk({
            text: chunk.message.content,
            done: false
          });
        }
      }
      
      // Calculate token usage
      const promptTokens = this.estimateTokenCount(prompt);
      const completionTokens = this.estimateTokenCount(fullCompletion);
      const totalTokens = promptTokens + completionTokens;
      
      // Calculate cost
      const modelCosts = this.costs[model] || { input: 0.0005, output: 0.0015 };
      const cost = (
        (promptTokens / 1000) * modelCosts.input +
        (completionTokens / 1000) * modelCosts.output
      );
      
      // Update usage stats
      this.updateUsageStats({
        promptTokens,
        completionTokens,
        totalTokens,
        cost
      });
      
      // Signal completion
      onChunk({
        text: '',
        done: true,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens,
          cost
        }
      });

      return {
        success: true,
        completion: fullCompletion,
        model,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens,
          cost
        }
      };
    } catch (error) {
      console.error(`Google AI streaming completion error (attempt ${retryCount + 1}):`, error);
      
      // Retry logic for certain errors
      if (retryCount < this.maxRetries && this.shouldRetry(error)) {
        console.log(`Retrying Google AI streaming completion (attempt ${retryCount + 2})`);
        // Exponential backoff: 1s, 2s, 4s, etc.
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.generateCompletionStream(prompt, options, onChunk, retryCount + 1);
      }
      
      // Signal error to the stream consumer
      onChunk({
        text: '',
        done: true,
        error: error.message
      });
      
      return {
        success: false,
        error: error.message,
        model: options.model || this.defaultModel
      };
    }
  }

  /**
   * Determine if an error should trigger a retry
   * @param {Error} error - The error to check
   * @returns {boolean} - Whether to retry
   */
  shouldRetry(error) {
    // Retry on rate limiting, temporary server errors, and network issues
    const retryableErrors = [
      'rate limit',
      'timeout',
      'connection',
      'socket',
      'ECONNRESET',
      '429',
      '500',
      '502',
      '503',
      '504'
    ];
    
    const errorStr = error.message.toLowerCase();
    return retryableErrors.some(term => errorStr.includes(term));
  }
}

module.exports = GoogleAIProvider;