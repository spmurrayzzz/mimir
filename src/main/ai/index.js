/**
 * AI Integration System Entry Point
 * This file initializes and exports the AI integration components
 */

const AIManager = require('./AIManager');
const ProviderFactory = require('./ProviderFactory');
const PromptManager = require('../../prompts/PromptManager');
const ResponseProcessor = require('../../lib/ai/ResponseProcessor');
const ConversationManager = require('../../lib/ai/ConversationManager');

/**
 * Initialize the AI system with the given settings
 * @param {Object} settings - AI system settings
 * @returns {Promise<boolean>} - Initialization success
 */
async function initialize(settings = {}) {
  try {
    console.log('Initializing Mimir AI System...');
    
    // Initialize AI Manager
    await AIManager.initialize(settings);
    
    // Load conversation history
    await ConversationManager.loadConversations();
    
    console.log('Mimir AI System initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Mimir AI System:', error);
    return false;
  }
}

/**
 * Generate a completion with the default provider
 * @param {string} prompt - The prompt to send to the AI
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} - The completion result
 */
async function generateCompletion(prompt, options = {}) {
  try {
    const provider = options.provider 
      ? AIManager.getProvider(options.provider) 
      : AIManager.getDefaultProvider();
    
    return await provider.generateCompletion(prompt, options);
  } catch (error) {
    console.error('Error generating completion:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate a streaming completion with the default provider
 * @param {string} prompt - The prompt to send to the AI
 * @param {Object} options - Generation options
 * @param {function} onChunk - Callback for each chunk of the stream
 * @returns {Promise<Object>} - The completion result
 */
async function generateCompletionStream(prompt, options = {}, onChunk = () => {}) {
  try {
    const provider = options.provider 
      ? AIManager.getProvider(options.provider) 
      : AIManager.getDefaultProvider();
    
    return await provider.generateCompletionStream(prompt, options, (chunk) => {
      ResponseProcessor.processStreamChunk(chunk, options.conversationId || 'default', onChunk);
    });
  } catch (error) {
    console.error('Error generating streaming completion:', error);
    onChunk({ text: '', done: true, error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Create a conversation with the AI
 * @param {string} prompt - The initial prompt
 * @param {Object} options - Conversation options
 * @returns {Promise<Object>} - The conversation result
 */
async function createConversation(prompt, options = {}) {
  try {
    // Create a new conversation
    const conversationId = ConversationManager.createConversation({
      title: options.title || 'New Conversation',
      projectId: options.projectId,
      filePath: options.filePath,
      initialContext: options.initialContext || []
    });
    
    // Add the initial user message
    ConversationManager.addMessage(conversationId, {
      role: 'user',
      content: prompt
    });
    
    // Generate the AI response
    const streamOptions = {
      ...options,
      conversationId
    };
    
    const chunks = [];
    let fullResponse = '';
    
    const result = await generateCompletionStream(prompt, streamOptions, (chunk) => {
      if (!chunk.done) {
        chunks.push(chunk.text);
        if (options.onChunk) {
          options.onChunk(chunk);
        }
      }
    });
    
    fullResponse = chunks.join('');
    
    // Add the AI response to the conversation
    ConversationManager.addMessage(conversationId, {
      role: 'assistant',
      content: fullResponse
    });
    
    return {
      success: true,
      conversationId,
      response: fullResponse,
      conversation: ConversationManager.getConversation(conversationId)
    };
  } catch (error) {
    console.error('Error creating conversation:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Process special actions from an AI response
 * @param {Object} actions - The actions to process
 * @returns {Promise<Object>} - Processing results
 */
async function processActions(actions) {
  try {
    return await ResponseProcessor.processFileOperations(actions);
  } catch (error) {
    console.error('Error processing actions:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Format a prompt using a template
 * @param {string} templateName - The template name
 * @param {Object} variables - Template variables
 * @returns {string} - Formatted prompt
 */
function formatPrompt(templateName, variables) {
  return PromptManager.formatTemplate(templateName, variables);
}

/**
 * Extract code blocks from an AI response
 * @param {string} response - The AI response
 * @returns {Array} - Extracted code blocks
 */
function extractCodeBlocks(response) {
  return ResponseProcessor.extractCodeBlocks(response);
}

/**
 * Extract action tags from an AI response
 * @param {string} response - The AI response
 * @returns {Object} - Extracted actions and cleaned response
 */
function extractActionTags(response) {
  return PromptManager.extractActionTags(response);
}

// Export the Mimir AI API
module.exports = {
  initialize,
  generateCompletion,
  generateCompletionStream,
  createConversation,
  processActions,
  formatPrompt,
  extractCodeBlocks,
  extractActionTags,
  AIManager,
  ProviderFactory,
  PromptManager,
  ResponseProcessor,
  ConversationManager
};