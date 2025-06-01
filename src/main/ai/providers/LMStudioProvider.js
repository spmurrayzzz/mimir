/**
 * LM Studio Provider Implementation
 * For local AI model inference using LM Studio
 */

const BaseProvider = require('../BaseProvider');
const { default: fetch } = require('@ai-sdk/fetch');
const EventEmitter = require('events');

class LMStudioProvider extends BaseProvider {
  /**
   * Initialize the LM Studio provider
   * @param {Object} config - Provider configuration
   */
  constructor(config = {}) {
    super(config);
    this.name = 'lmstudio';
    // LM Studio can run many different models, but these are common ones
    this.supportedModels = [
      'default',
      'custom'
    ];
    
    // Cost is effectively $0 since these are local models
    this.costs = {
      'default': { input: 0, output: 0 },
      'custom': { input: 0, output: 0 }
    };
    
    this.baseUrl = config.baseUrl || 'http://localhost:1234/v1';
    this.defaultModel = config.defaultModel || 'default';
  }

  /**
   * Connect to the LM Studio API
   * @returns {Promise<boolean>} - Connection success
   */
  async connect() {
    try {
      // Check if LM Studio is running by making a simple models request
      const response = await fetch(`${this.baseUrl}/models`);
      
      if (!response.ok) {
        throw new Error(`Failed to connect to LM Studio: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update supported models from the running instance
      if (data.data && Array.isArray(data.data)) {
        this.supportedModels = data.data.map(model => model.id);
      }
      
      this.isConnected = true;
      console.log('Connected to LM Studio API successfully');
      console.log('Available models:', this.supportedModels);
      return true;
    } catch (error) {
      console.error('Failed to connect to LM Studio API:', error);
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
      const response = await fetch(`${this.baseUrl}/models`);
      return response.ok;
    } catch (error) {
      console.error('LM Studio health check failed:', error);
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
      const model = options.model || this.defaultModel;
      const temperature = options.temperature || 0.7;
      const maxTokens = options.maxTokens || 1024;
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature,
          max_tokens: maxTokens,
          stream: false
        })
      });
      
      if (!response.ok) {
        throw new Error(`LM Studio API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      let completion = '';
      
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        completion = data.choices[0].message.content;
      }
      
      // Calculate token usage (LM Studio doesn't always provide reliable token counts)
      let promptTokens = 0;
      let completionTokens = 0;
      
      if (data.usage) {
        promptTokens = data.usage.prompt_tokens || this.estimateTokenCount(prompt);
        completionTokens = data.usage.completion_tokens || this.estimateTokenCount(completion);
      } else {
        promptTokens = this.estimateTokenCount(prompt);
        completionTokens = this.estimateTokenCount(completion);
      }
      
      const totalTokens = promptTokens + completionTokens;
      
      // Update usage stats (cost is 0 for local models)
      this.updateUsageStats({
        promptTokens,
        completionTokens,
        totalTokens,
        cost: 0
      });

      return {
        success: true,
        completion,
        model,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens,
          cost: 0
        }
      };
    } catch (error) {
      console.error('LM Studio completion error:', error);
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
      const model = options.model || this.defaultModel;
      const temperature = options.temperature || 0.7;
      const maxTokens = options.maxTokens || 1024;
      
      const controller = new AbortController();
      const emitter = new EventEmitter();
      
      // Track the full response for token counting
      let fullCompletion = '';
      
      // Make the streaming request
      fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature,
          max_tokens: maxTokens,
          stream: true
        }),
        signal: controller.signal
      }).then(async response => {
        if (!response.ok) {
          throw new Error(`LM Studio API error: ${response.status} ${response.statusText}`);
        }
        
        // Process the stream line by line
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete JSON objects
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep the potentially incomplete line for the next iteration
            
            for (const line of lines) {
              if (!line.trim() || line.trim() === 'data: [DONE]') continue;
              
              try {
                // Extract JSON data (format: "data: {json}")
                const jsonData = line.replace(/^data: /, '').trim();
                const data = JSON.parse(jsonData);
                
                if (data.choices && data.choices.length > 0) {
                  const choice = data.choices[0];
                  if (choice.delta && choice.delta.content) {
                    fullCompletion += choice.delta.content;
                    emitter.emit('chunk', {
                      text: choice.delta.content,
                      done: false
                    });
                  }
                  
                  if (choice.finish_reason === 'stop') {
                    // Calculate token usage
                    const promptTokens = this.estimateTokenCount(prompt);
                    const completionTokens = this.estimateTokenCount(fullCompletion);
                    const totalTokens = promptTokens + completionTokens;
                    
                    // Update usage stats (cost is 0 for local models)
                    this.updateUsageStats({
                      promptTokens,
                      completionTokens,
                      totalTokens,
                      cost: 0
                    });
                    
                    // Signal completion with usage stats
                    emitter.emit('chunk', {
                      text: '',
                      done: true,
                      usage: {
                        promptTokens,
                        completionTokens,
                        totalTokens,
                        cost: 0
                      }
                    });
                    
                    emitter.emit('done', {
                      success: true,
                      completion: fullCompletion,
                      model,
                      usage: {
                        promptTokens,
                        completionTokens,
                        totalTokens,
                        cost: 0
                      }
                    });
                  }
                }
              } catch (err) {
                console.error('Error parsing LM Studio stream JSON:', err, line);
              }
            }
          }
          
          // If we've reached the end without a "stop" finish_reason
          if (fullCompletion) {
            // Calculate token usage
            const promptTokens = this.estimateTokenCount(prompt);
            const completionTokens = this.estimateTokenCount(fullCompletion);
            const totalTokens = promptTokens + completionTokens;
            
            // Signal completion
            emitter.emit('chunk', {
              text: '',
              done: true,
              usage: {
                promptTokens,
                completionTokens,
                totalTokens,
                cost: 0
              }
            });
            
            emitter.emit('done', {
              success: true,
              completion: fullCompletion,
              model,
              usage: {
                promptTokens,
                completionTokens,
                totalTokens,
                cost: 0
              }
            });
          }
        } catch (streamError) {
          console.error('LM Studio stream reading error:', streamError);
          emitter.emit('error', streamError);
        }
      }).catch(error => {
        console.error('LM Studio streaming request error:', error);
        emitter.emit('error', error);
      });
      
      // Set up event listeners
      emitter.on('chunk', onChunk);
      
      return new Promise((resolve, reject) => {
        emitter.once('done', resolve);
        emitter.once('error', (error) => {
          // Signal error to the stream consumer
          onChunk({
            text: '',
            done: true,
            error: error.message
          });
          
          reject({
            success: false,
            error: error.message,
            model
          });
        });
      });
    } catch (error) {
      console.error('LM Studio streaming completion error:', error);
      
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

module.exports = LMStudioProvider;