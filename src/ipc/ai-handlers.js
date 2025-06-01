/**
 * AI operation IPC handlers
 */

const AIManager = require('../main/ai/AIManager');
const PromptManager = require('../prompts/PromptManager');
const ResponseProcessor = require('../lib/ai/ResponseProcessor');
const ConversationManager = require('../lib/ai/ConversationManager');
const crypto = require('crypto');

/**
 * Register all AI operation IPC handlers
 * @param {Electron.IpcMain} ipcMain - The Electron IpcMain instance
 * @param {Electron.BrowserWindow} mainWindow - The main application window
 */
function register(ipcMain, mainWindow) {
  // Initialize AI system
  ipcMain.handle('ai:initialize', async (_, settings) => {
    try {
      const success = await AIManager.initialize(settings);
      return { success };
    } catch (error) {
      console.error('Error initializing AI system:', error);
      return { success: false, error: error.message };
    }
  });

  // Handler for generating text completions
  ipcMain.handle('ai:completion', async (_, prompt, options) => {
    try {
      console.log('AI completion handler called with prompt:', prompt);
      console.log('Options:', options);
      
      const providerType = options?.provider || null;
      const provider = providerType 
        ? AIManager.getProvider(providerType) 
        : AIManager.getDefaultProvider();
      
      if (!provider) {
        throw new Error('No AI provider available');
      }
      
      const result = await provider.generateCompletion(prompt, options);
      return result;
    } catch (error) {
      console.error('Error generating AI completion:', error);
      return { success: false, error: error.message };
    }
  });

  // Handler for generating streaming completions
  ipcMain.handle('ai:completionStream', async (_, prompt, options) => {
    try {
      console.log('AI streaming completion handler called');
      
      const providerType = options?.provider || null;
      const provider = providerType 
        ? AIManager.getProvider(providerType) 
        : AIManager.getDefaultProvider();
      
      if (!provider) {
        throw new Error('No AI provider available');
      }
      
      // Generate a unique stream ID
      const streamId = crypto.randomUUID();
      
      // Set up the stream handler
      provider.generateCompletionStream(prompt, options, (chunk) => {
        // Process the chunk before sending to renderer
        ResponseProcessor.processStreamChunk(chunk, streamId, (processedChunk) => {
          mainWindow.webContents.send('ai:stream', {
            id: streamId,
            ...processedChunk
          });
        });
      }).then((finalResult) => {
        // Stream completed
        mainWindow.webContents.send('ai:streamComplete', {
          id: streamId,
          ...finalResult
        });
      }).catch((streamError) => {
        // Stream error
        console.error('AI stream error:', streamError);
        mainWindow.webContents.send('ai:streamError', {
          id: streamId,
          error: streamError.message
        });
      });
      
      return { success: true, streamId };
    } catch (error) {
      console.error('Error setting up AI completion stream:', error);
      return { success: false, error: error.message };
    }
  });

  // Handler for canceling streaming completions
  ipcMain.handle('ai:cancelStream', async (_, streamId) => {
    try {
      console.log('AI streaming cancellation requested for stream:', streamId);
      
      // Not all providers support cancellation, but we can clean up resources
      ResponseProcessor.clearResponseCache(streamId);
      
      return { success: true };
    } catch (error) {
      console.error('Error canceling AI stream:', error);
      return { success: false, error: error.message };
    }
  });

  // Handler for generating code
  ipcMain.handle('ai:code', async (_, prompt, options) => {
    try {
      console.log('AI code generation handler called with prompt:', prompt);
      
      const providerType = options?.provider || null;
      const provider = providerType 
        ? AIManager.getProvider(providerType) 
        : AIManager.getDefaultProvider();
      
      if (!provider) {
        throw new Error('No AI provider available');
      }
      
      // Format the prompt for code generation
      const formattedPrompt = PromptManager.formatTemplate('codeGeneration', {
        language: options?.language || 'javascript',
        requirements: prompt,
        projectContext: options?.projectContext || '',
        additionalNotes: options?.additionalNotes || ''
      });
      
      const result = await provider.generateCompletion(formattedPrompt, options);
      
      // Extract code blocks from the response
      if (result.success) {
        const codeBlocks = ResponseProcessor.extractCodeBlocks(result.completion);
        result.code = codeBlocks.length > 0 ? codeBlocks[0].code : result.completion;
        result.language = codeBlocks.length > 0 ? codeBlocks[0].language : (options?.language || 'javascript');
      }
      
      return result;
    } catch (error) {
      console.error('Error generating code:', error);
      return { success: false, error: error.message };
    }
  });

  // Handler for getting all available AI providers
  ipcMain.handle('ai:getProviders', async () => {
    try {
      const providers = AIManager.getAllProviders();
      const result = {};
      
      for (const [type, provider] of Object.entries(providers)) {
        result[type] = {
          name: provider.name,
          isConnected: provider.isConnected,
          supportedModels: provider.supportedModels,
          defaultModel: provider.defaultModel
        };
      }
      
      return {
        success: true,
        providers: result,
        defaultProvider: AIManager.defaultProvider
      };
    } catch (error) {
      console.error('Error getting AI providers:', error);
      return { success: false, error: error.message };
    }
  });

  // Handler for setting an API key
  ipcMain.handle('ai:setApiKey', async (_, providerType, apiKey) => {
    try {
      const success = await AIManager.setApiKey(providerType, apiKey);
      return { success };
    } catch (error) {
      console.error('Error setting API key:', error);
      return { success: false, error: error.message };
    }
  });

  // Handler for deleting an API key
  ipcMain.handle('ai:deleteApiKey', async (_, providerType) => {
    try {
      const success = await AIManager.deleteApiKey(providerType);
      return { success };
    } catch (error) {
      console.error('Error deleting API key:', error);
      return { success: false, error: error.message };
    }
  });

  // Handler for setting the default provider
  ipcMain.handle('ai:setDefaultProvider', async (_, providerType) => {
    try {
      const success = AIManager.setDefaultProvider(providerType);
      return { success };
    } catch (error) {
      console.error('Error setting default provider:', error);
      return { success: false, error: error.message };
    }
  });

  // Handler for checking provider health
  ipcMain.handle('ai:checkProviderHealth', async (_, providerType) => {
    try {
      const isHealthy = await AIManager.checkProviderHealth(providerType);
      return { success: true, isHealthy };
    } catch (error) {
      console.error('Error checking provider health:', error);
      return { success: false, error: error.message };
    }
  });

  // Handler for getting usage statistics
  ipcMain.handle('ai:getUsageStats', async () => {
    try {
      const stats = AIManager.getUsageStats();
      return { success: true, stats };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return { success: false, error: error.message };
    }
  });

  // Handler for resetting usage statistics
  ipcMain.handle('ai:resetUsageStats', async () => {
    try {
      const success = AIManager.resetUsageStats();
      return { success };
    } catch (error) {
      console.error('Error resetting usage stats:', error);
      return { success: false, error: error.message };
    }
  });

  // Conversation management handlers
  
  // Create a new conversation
  ipcMain.handle('ai:createConversation', async (_, options) => {
    try {
      const conversationId = ConversationManager.createConversation(options);
      return { 
        success: true, 
        conversationId,
        conversation: ConversationManager.getConversation(conversationId)
      };
    } catch (error) {
      console.error('Error creating conversation:', error);
      return { success: false, error: error.message };
    }
  });

  // Get conversation by ID
  ipcMain.handle('ai:getConversation', async (_, conversationId) => {
    try {
      const conversation = ConversationManager.getConversation(conversationId);
      return { 
        success: true, 
        conversation
      };
    } catch (error) {
      console.error('Error getting conversation:', error);
      return { success: false, error: error.message };
    }
  });

  // Get all conversations
  ipcMain.handle('ai:getAllConversations', async (_, filters) => {
    try {
      const conversations = ConversationManager.getAllConversations(filters);
      return { 
        success: true, 
        conversations
      };
    } catch (error) {
      console.error('Error getting all conversations:', error);
      return { success: false, error: error.message };
    }
  });

  // Add message to conversation
  ipcMain.handle('ai:addMessage', async (_, conversationId, message) => {
    try {
      const success = ConversationManager.addMessage(conversationId, message);
      return { success };
    } catch (error) {
      console.error('Error adding message to conversation:', error);
      return { success: false, error: error.message };
    }
  });

  // Delete conversation
  ipcMain.handle('ai:deleteConversation', async (_, conversationId) => {
    try {
      const success = ConversationManager.deleteConversation(conversationId);
      return { success };
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return { success: false, error: error.message };
    }
  });

  // Update conversation context
  ipcMain.handle('ai:updateContext', async (_, conversationId, context) => {
    try {
      const success = ConversationManager.updateContext(conversationId, context);
      return { success };
    } catch (error) {
      console.error('Error updating conversation context:', error);
      return { success: false, error: error.message };
    }
  });
  
  // Process AI actions
  ipcMain.handle('ai:processActions', async (_, actions) => {
    try {
      const results = await ResponseProcessor.processFileOperations(actions);
      return { 
        success: true, 
        results
      };
    } catch (error) {
      console.error('Error processing AI actions:', error);
      return { success: false, error: error.message };
    }
  });

  // Load saved conversations
  ipcMain.handle('ai:loadConversations', async () => {
    try {
      const count = await ConversationManager.loadConversations();
      return { 
        success: true, 
        count
      };
    } catch (error) {
      console.error('Error loading conversations:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  register
};