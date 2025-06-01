/**
 * Ollama Provider Implementation
 * For local AI model inference using Ollama
 */

const BaseProvider = require('../BaseProvider');
const { default: fetch } = require('@ai-sdk/fetch');
const EventEmitter = require('events');

class OllamaProvider extends BaseProvider {
  /**
   * Initialize the Ollama provider
   * @param {Object} config - Provider configuration
   */
  constructor(config = {}) {
    super(config);
    this.name = 'ollama';
    this.supportedModels = [
      'llama3', 
      'llama3:8b',
      'llama3:70b', 
      'codellama',
      'mistral',
      'phi3',
      'gemma'
    ];
    
    // Cost is effectively $0 since these are local models
    this.costs = {
      'llama3': { input: 0, output: 0 },
      'llama3:8b': { input: 0, output: 0 },
      'llama3:70b': { input: 0, output: 0 },
      'codellama': { input: 0, output: 0 },
      'mistral': { input: 0, output: 0 },
      'phi3': { input: 0, output: 0 },
      'gemma': { input: 0, output: 0 }
    };
    
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.defaultModel = config.defaultModel || 'llama3';
  }

  /**
   * Connect to the Ollama API
   * @returns {Promise<boolean>} - Connection success
   */
  async connect() {
    try {
      // Check if Ollama is running by requesting the list of models
      const response = await fetch(`${this.baseUrl}/api/tags`);
      
      if (!response.ok) {
        throw new Error(`Failed to connect to Ollama: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update supported models from the running instance
      if (data.models && Array.isArray(data.models)) {
        this.supportedModels = data.models.map(model => model.name);
      }
      
      this.isConnected = true;
      console.log('Connected to Ollama API successfully');
      console.log('Available models:', this.supportedModels);
      return true;
    } catch (error) {
      console.error('Failed to connect to Ollama API:', error);
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
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch (error) {
      console.error('Ollama health check failed:', error);
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
      
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          prompt,
          temperature,
          max_tokens: maxTokens,
          stream: false
        })
      });
      
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Calculate token usage (Ollama doesn't provide this, so we estimate)
      const promptTokens = this.estimateTokenCount(prompt);
      const completionTokens = this.estimateTokenCount(data.response);
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
        completion: data.response,
        model,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens,
          cost: 0
        }
      };
    } catch (error) {
      console.error('Ollama completion error:', error);
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
      fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          prompt,
          temperature,
          max_tokens: maxTokens,
          stream: true
        }),
        signal: controller.signal
      }).then(async response => {
        if (!response.ok) {
          throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
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
              if (!line.trim()) continue;
              
              try {
                const data = JSON.parse(line);
                if (data.response) {
                  fullCompletion += data.response;
                  emitter.emit('chunk', {
                    text: data.response,
                    done: false
                  });
                }
                
                if (data.done) {
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
              } catch (err) {
                console.error('Error parsing Ollama stream JSON:', err, line);
              }
            }
          }
        } catch (streamError) {
          console.error('Ollama stream reading error:', streamError);
          emitter.emit('error', streamError);
        }
      }).catch(error => {
        console.error('Ollama streaming request error:', error);
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
      console.error('Ollama streaming completion error:', error);
      
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

module.exports = OllamaProvider;