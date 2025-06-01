import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useSettingsStore } from '../stores/settingsStore';
import { v4 as uuidv4 } from 'uuid';

/**
 * Composable for interacting with AI features
 * @returns {Object} - AI utilities and state
 */
export function useAI() {
  const isGenerating = ref(false);
  const error = ref(null);
  const settingsStore = useSettingsStore();
  const isStreaming = ref(false);
  const streamingText = ref('');
  const providers = ref({});
  const defaultProvider = ref(null);
  const currentStreamId = ref(null);
  const usageStats = ref(null);
  
  // Get AI model settings from store
  const aiSettings = computed(() => settingsStore.ai);
  
  /**
   * Initialize AI system
   * @returns {Promise<boolean>} - Success
   */
  async function initializeAI() {
    try {
      const result = await window.electronAPI.initializeAI(aiSettings.value);
      if (!result.success) {
        throw new Error(result.error || 'Failed to initialize AI');
      }
      
      await loadProviders();
      return true;
    } catch (err) {
      error.value = err.message;
      console.error('AI initialization error:', err);
      return false;
    }
  }
  
  /**
   * Load available AI providers
   * @returns {Promise<Object>} - Available providers
   */
  async function loadProviders() {
    try {
      const result = await window.electronAPI.getAIProviders();
      if (!result.success) {
        throw new Error(result.error || 'Failed to get AI providers');
      }
      
      providers.value = result.providers;
      defaultProvider.value = result.defaultProvider;
      return result.providers;
    } catch (err) {
      error.value = err.message;
      console.error('Error loading AI providers:', err);
      throw err;
    }
  }
  
  /**
   * Generate a text completion using AI
   * @param {string} prompt - The prompt to send to the AI
   * @param {Object} options - Optional parameters
   * @returns {Promise<string>} - The generated completion
   */
  async function generateCompletion(prompt, options = {}) {
    isGenerating.value = true;
    error.value = null;
    
    try {
      // Merge default options with provided options
      const mergedOptions = {
        model: options.model || aiSettings.value.defaultCompletionModel,
        temperature: options.temperature || aiSettings.value.temperature,
        maxTokens: options.maxTokens || aiSettings.value.maxTokens,
        provider: options.provider || defaultProvider.value
      };
      
      // Call the Electron API to generate completion
      const result = await window.electronAPI.generateCompletion(prompt, mergedOptions);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate completion');
      }
      
      return result.completion;
    } catch (err) {
      error.value = err.message;
      console.error('AI completion error:', err);
      throw err;
    } finally {
      isGenerating.value = false;
    }
  }
  
  /**
   * Generate a streaming completion using AI
   * @param {string} prompt - The prompt to send to the AI
   * @param {Object} options - Optional parameters
   * @param {function} onChunk - Callback for each chunk of the stream
   * @returns {Promise<string>} - The final completion
   */
  async function generateCompletionStream(prompt, options = {}, onChunk = null) {
    isGenerating.value = true;
    isStreaming.value = true;
    error.value = null;
    streamingText.value = '';
    
    try {
      // Merge default options with provided options
      const mergedOptions = {
        model: options.model || aiSettings.value.defaultCompletionModel,
        temperature: options.temperature || aiSettings.value.temperature,
        maxTokens: options.maxTokens || aiSettings.value.maxTokens,
        provider: options.provider || defaultProvider.value
      };
      
      // Setup stream handlers if not already set up
      setupStreamHandlers();
      
      // Call the Electron API to generate streaming completion
      const result = await window.electronAPI.generateCompletionStream(prompt, mergedOptions);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to start completion stream');
      }
      
      // Store the stream ID
      currentStreamId.value = result.streamId;
      
      // Return a promise that resolves when streaming is complete
      return new Promise((resolve, reject) => {
        const streamCompleteHandler = (result) => {
          if (result.id === currentStreamId.value) {
            // Clean up
            isGenerating.value = false;
            isStreaming.value = false;
            currentStreamId.value = null;
            
            if (result.success) {
              resolve(streamingText.value);
            } else {
              reject(new Error(result.error || 'Stream failed'));
            }
          }
        };
        
        const streamErrorHandler = (errorResult) => {
          if (errorResult.id === currentStreamId.value) {
            // Clean up
            isGenerating.value = false;
            isStreaming.value = false;
            error.value = errorResult.error;
            currentStreamId.value = null;
            
            reject(new Error(errorResult.error || 'Stream error'));
          }
        };
        
        // Custom stream handler for this request
        const customStreamHandler = (chunk) => {
          if (chunk.id === currentStreamId.value) {
            if (!chunk.done) {
              streamingText.value += chunk.text;
              if (onChunk) {
                onChunk(chunk.text, false);
              }
            } else if (chunk.error) {
              if (onChunk) {
                onChunk('', true, chunk.error);
              }
            } else {
              if (onChunk) {
                onChunk('', true);
              }
            }
          }
        };
        
        // Set up one-time handlers for this specific stream
        window.electronAPI.onAIStreamComplete(streamCompleteHandler);
        window.electronAPI.onAIStreamError(streamErrorHandler);
        window.electronAPI.onAIStream(customStreamHandler);
      });
    } catch (err) {
      isGenerating.value = false;
      isStreaming.value = false;
      error.value = err.message;
      console.error('AI streaming error:', err);
      throw err;
    }
  }
  
  /**
   * Cancel the current streaming completion
   * @returns {Promise<boolean>} - Success
   */
  async function cancelCompletionStream() {
    if (!currentStreamId.value || !isStreaming.value) {
      return true;
    }
    
    try {
      const result = await window.electronAPI.cancelCompletionStream(currentStreamId.value);
      
      isGenerating.value = false;
      isStreaming.value = false;
      currentStreamId.value = null;
      
      return result.success;
    } catch (err) {
      console.error('Error canceling stream:', err);
      return false;
    }
  }
  
  /**
   * Set up stream event handlers
   */
  function setupStreamHandlers() {
    // These are set up for each individual stream request in generateCompletionStream
  }
  
  /**
   * Generate code using AI
   * @param {string} prompt - The prompt to send to the AI
   * @param {Object} options - Optional parameters
   * @returns {Promise<Object>} - The generated code and metadata
   */
  async function generateCode(prompt, options = {}) {
    isGenerating.value = true;
    error.value = null;
    
    try {
      // Merge default options with provided options
      const mergedOptions = {
        model: options.model || aiSettings.value.defaultCodeModel,
        temperature: options.temperature || aiSettings.value.temperature,
        maxTokens: options.maxTokens || aiSettings.value.maxTokens,
        language: options.language || 'javascript',
        provider: options.provider || defaultProvider.value,
        projectContext: options.projectContext || '',
        additionalNotes: options.additionalNotes || ''
      };
      
      // Call the Electron API to generate code
      const result = await window.electronAPI.generateCode(prompt, mergedOptions);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate code');
      }
      
      return {
        code: result.code,
        language: result.language,
        model: result.model,
        usage: result.usage
      };
    } catch (err) {
      error.value = err.message;
      console.error('AI code generation error:', err);
      throw err;
    } finally {
      isGenerating.value = false;
    }
  }
  
  /**
   * Set API key for a provider
   * @param {string} providerType - The provider type
   * @param {string} apiKey - The API key
   * @returns {Promise<boolean>} - Success
   */
  async function setAPIKey(providerType, apiKey) {
    try {
      const result = await window.electronAPI.setAPIKey(providerType, apiKey);
      if (result.success) {
        await loadProviders(); // Refresh providers after setting key
      }
      return result.success;
    } catch (err) {
      error.value = err.message;
      console.error(`Error setting API key for ${providerType}:`, err);
      return false;
    }
  }
  
  /**
   * Set default AI provider
   * @param {string} providerType - The provider type
   * @returns {Promise<boolean>} - Success
   */
  async function setDefaultProvider(providerType) {
    try {
      const result = await window.electronAPI.setDefaultProvider(providerType);
      if (result.success) {
        defaultProvider.value = providerType;
      }
      return result.success;
    } catch (err) {
      error.value = err.message;
      console.error(`Error setting default provider to ${providerType}:`, err);
      return false;
    }
  }
  
  /**
   * Get usage statistics for AI providers
   * @returns {Promise<Object>} - Usage statistics
   */
  async function getUsageStats() {
    try {
      const result = await window.electronAPI.getUsageStats();
      if (result.success) {
        usageStats.value = result.stats;
      }
      return result.stats;
    } catch (err) {
      error.value = err.message;
      console.error('Error getting usage stats:', err);
      throw err;
    }
  }
  
  /**
   * Reset usage statistics for AI providers
   * @returns {Promise<boolean>} - Success
   */
  async function resetUsageStats() {
    try {
      const result = await window.electronAPI.resetUsageStats();
      if (result.success) {
        usageStats.value = null;
      }
      return result.success;
    } catch (err) {
      error.value = err.message;
      console.error('Error resetting usage stats:', err);
      return false;
    }
  }
  
  // Clean up event listeners on component unmount
  onUnmounted(() => {
    if (currentStreamId.value) {
      cancelCompletionStream().catch(console.error);
    }
  });
  
  return {
    isGenerating,
    isStreaming,
    streamingText,
    error,
    aiSettings,
    providers,
    defaultProvider,
    usageStats,
    initializeAI,
    loadProviders,
    generateCompletion,
    generateCompletionStream,
    cancelCompletionStream,
    generateCode,
    setAPIKey,
    setDefaultProvider,
    getUsageStats,
    resetUsageStats
  };
}