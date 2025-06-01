/**
 * Anthropic Provider Implementation
 */

const BaseProvider = require('../BaseProvider');
const { Anthropic } = require('@ai-sdk/provider-anthropic');
const { createAI } = require('@ai-sdk/fetch');

class AnthropicProvider extends BaseProvider {
  /**
   * Initialize the Anthropic provider
   * @param {Object} config - Provider configuration
   */
  constructor(config = {}) {
    super(config);
    this.name = 'anthropic';
    this.supportedModels = [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229', 
      'claude-3-haiku-20240307',
      'claude-2.1',
      'claude-2.0',
      'claude-instant-1.2'
    ];
    
    // Cost per 1000 tokens in USD by model
    this.costs = {
      'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
      'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
      'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
      'claude-2.1': { input: 0.008, output: 0.024 },
      'claude-2.0': { input: 0.008, output: 0.024 },
      'claude-instant-1.2': { input: 0.0008, output: 0.0024 }
    };
    
    this.client = null;
    this.defaultModel = config.defaultModel || 'claude-3-haiku-20240307';
  }

  /**
   * Connect to the Anthropic API
   * @returns {Promise<boolean>} - Connection success
   */
  async connect() {
    try {
      if (!this.config.apiKey) {
        throw new Error('Anthropic API key is required');
      }

      const provider = new Anthropic({
        apiKey: this.config.apiKey,
        baseURL: this.config.baseURL || undefined
      });

      this.client = createAI({
        provider
      });

      this.isConnected = true;
      console.log('Connected to Anthropic API successfully');
      return true;
    } catch (error) {
      console.error('Failed to connect to Anthropic API:', error);
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
      console.error('Anthropic health check failed:', error);
      return false;
    }
  }

  /**
   * Generate a text completion
   * @param {string} prompt - The input prompt
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - The completion result
   */
  async generateCompletion(prompt, options = {}) {
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
      const modelCosts = this.costs[model] || { input: 0.003, output: 0.015 };
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
      console.error('Anthropic completion error:', error);
      return {
        success: false,
        error: error.message,
        model: options.model || this.defaultModel
      };
    }
  }

  /**
   * Generate a streaming text completion
   * @param {string} prompt - The input prompt
   * @param {Object} options - Generation options
   * @param {function} onChunk - Callback for each chunk of the stream
   * @returns {Promise<Object>} - The completion result
   */
  async generateCompletionStream(prompt, options = {}, onChunk = () => {}) {
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
      const modelCosts = this.costs[model] || { input: 0.003, output: 0.015 };
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
      console.error('Anthropic streaming completion error:', error);
      
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
}

module.exports = AnthropicProvider;