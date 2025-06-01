/**
 * OpenAI Provider Implementation
 */

const BaseProvider = require('../BaseProvider');
const { OpenAI } = require('@ai-sdk/provider-openai');
const { createAI } = require('@ai-sdk/fetch');

class OpenAIProvider extends BaseProvider {
  /**
   * Initialize the OpenAI provider
   * @param {Object} config - Provider configuration
   */
  constructor(config = {}) {
    super(config);
    this.name = 'openai';
    this.supportedModels = [
      'gpt-4-0125-preview',
      'gpt-4-turbo-preview',
      'gpt-4-vision-preview',
      'gpt-4',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k'
    ];
    
    // Cost per 1000 tokens in USD by model
    this.costs = {
      'gpt-4-0125-preview': { input: 0.01, output: 0.03 },
      'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
      'gpt-4-vision-preview': { input: 0.01, output: 0.03 },
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
      'gpt-3.5-turbo-16k': { input: 0.003, output: 0.004 }
    };
    
    this.client = null;
    this.defaultModel = config.defaultModel || 'gpt-3.5-turbo';
  }

  /**
   * Connect to the OpenAI API
   * @returns {Promise<boolean>} - Connection success
   */
  async connect() {
    try {
      if (!this.config.apiKey) {
        throw new Error('OpenAI API key is required');
      }

      const provider = new OpenAI({
        apiKey: this.config.apiKey,
        baseURL: this.config.baseURL || undefined
      });

      this.client = createAI({
        provider
      });

      this.isConnected = true;
      console.log('Connected to OpenAI API successfully');
      return true;
    } catch (error) {
      console.error('Failed to connect to OpenAI API:', error);
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
      console.error('OpenAI health check failed:', error);
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
      const modelCosts = this.costs[model] || { input: 0.01, output: 0.03 };
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
      console.error('OpenAI completion error:', error);
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
      let lastError = null;
      
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
      const modelCosts = this.costs[model] || { input: 0.01, output: 0.03 };
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
      console.error('OpenAI streaming completion error:', error);
      
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

module.exports = OpenAIProvider;