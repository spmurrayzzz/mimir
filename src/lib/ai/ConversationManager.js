/**
 * Conversation Manager
 * Manages AI conversation history, context, and persistence
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const os = require('os');

class ConversationManager {
  constructor() {
    this.conversations = new Map();
    this.activeConversationId = null;
    this.storageDir = path.join(os.homedir(), '.mimir', 'conversations');
    
    // Create storage directory if it doesn't exist
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  /**
   * Create a new conversation
   * @param {Object} options - Conversation options
   * @returns {string} - The new conversation ID
   */
  createConversation(options = {}) {
    const {
      title = 'New Conversation',
      projectId = null,
      filePath = null,
      initialContext = []
    } = options;
    
    // Generate a unique ID
    const id = crypto.randomUUID();
    
    // Create the conversation object
    const conversation = {
      id,
      title,
      projectId,
      filePath,
      messages: [],
      context: initialContext,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Store the conversation
    this.conversations.set(id, conversation);
    this.activeConversationId = id;
    
    return id;
  }

  /**
   * Add a message to a conversation
   * @param {string} conversationId - The conversation ID
   * @param {Object} message - The message to add
   * @returns {boolean} - Success
   */
  addMessage(conversationId, message) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }
    
    // Add the message
    conversation.messages.push({
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    });
    
    // Update timestamp
    conversation.updatedAt = new Date().toISOString();
    
    // Save the conversation
    this.saveConversation(conversationId);
    
    return true;
  }

  /**
   * Get a conversation by ID
   * @param {string} conversationId - The conversation ID
   * @returns {Object|null} - The conversation object
   */
  getConversation(conversationId) {
    return this.conversations.get(conversationId) || null;
  }

  /**
   * Get the active conversation
   * @returns {Object|null} - The active conversation object
   */
  getActiveConversation() {
    if (!this.activeConversationId) return null;
    return this.conversations.get(this.activeConversationId) || null;
  }

  /**
   * Set the active conversation
   * @param {string} conversationId - The conversation ID
   * @returns {boolean} - Success
   */
  setActiveConversation(conversationId) {
    if (!this.conversations.has(conversationId)) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }
    
    this.activeConversationId = conversationId;
    return true;
  }

  /**
   * Get all conversations
   * @param {Object} filters - Optional filters
   * @returns {Array} - Array of conversation objects
   */
  getAllConversations(filters = {}) {
    const { projectId, filePath, limit, offset } = filters;
    
    // Convert the map to an array
    let conversations = Array.from(this.conversations.values());
    
    // Apply filters
    if (projectId) {
      conversations = conversations.filter(c => c.projectId === projectId);
    }
    
    if (filePath) {
      conversations = conversations.filter(c => c.filePath === filePath);
    }
    
    // Sort by updated timestamp (newest first)
    conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    // Apply pagination
    if (offset !== undefined && limit !== undefined) {
      conversations = conversations.slice(offset, offset + limit);
    }
    
    return conversations;
  }

  /**
   * Delete a conversation
   * @param {string} conversationId - The conversation ID
   * @returns {boolean} - Success
   */
  deleteConversation(conversationId) {
    if (!this.conversations.has(conversationId)) {
      return false;
    }
    
    // Delete from memory
    this.conversations.delete(conversationId);
    
    // Delete from disk
    try {
      const filePath = path.join(this.storageDir, `${conversationId}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`Error deleting conversation file for ${conversationId}:`, error);
    }
    
    // Reset active conversation if deleted
    if (this.activeConversationId === conversationId) {
      this.activeConversationId = null;
    }
    
    return true;
  }

  /**
   * Update conversation context
   * @param {string} conversationId - The conversation ID
   * @param {Array} context - The new context
   * @returns {boolean} - Success
   */
  updateContext(conversationId, context) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }
    
    conversation.context = context;
    conversation.updatedAt = new Date().toISOString();
    
    // Save the conversation
    this.saveConversation(conversationId);
    
    return true;
  }

  /**
   * Add context to a conversation
   * @param {string} conversationId - The conversation ID
   * @param {Object} contextItem - The context item to add
   * @returns {boolean} - Success
   */
  addContextItem(conversationId, contextItem) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }
    
    // Add the context item
    conversation.context.push(contextItem);
    conversation.updatedAt = new Date().toISOString();
    
    // Save the conversation
    this.saveConversation(conversationId);
    
    return true;
  }

  /**
   * Clear context from a conversation
   * @param {string} conversationId - The conversation ID
   * @returns {boolean} - Success
   */
  clearContext(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }
    
    conversation.context = [];
    conversation.updatedAt = new Date().toISOString();
    
    // Save the conversation
    this.saveConversation(conversationId);
    
    return true;
  }

  /**
   * Save a conversation to disk
   * @param {string} conversationId - The conversation ID
   * @returns {boolean} - Success
   */
  saveConversation(conversationId) {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) {
        throw new Error(`Conversation not found: ${conversationId}`);
      }
      
      const filePath = path.join(this.storageDir, `${conversationId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(conversation, null, 2), 'utf8');
      
      return true;
    } catch (error) {
      console.error(`Error saving conversation ${conversationId}:`, error);
      return false;
    }
  }

  /**
   * Load conversations from disk
   * @returns {Promise<number>} - Number of conversations loaded
   */
  async loadConversations() {
    try {
      const files = fs.readdirSync(this.storageDir);
      let count = 0;
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(this.storageDir, file);
            const data = fs.readFileSync(filePath, 'utf8');
            const conversation = JSON.parse(data);
            
            // Add to memory
            this.conversations.set(conversation.id, conversation);
            count++;
          } catch (fileError) {
            console.error(`Error loading conversation file ${file}:`, fileError);
          }
        }
      }
      
      return count;
    } catch (error) {
      console.error('Error loading conversations:', error);
      return 0;
    }
  }

  /**
   * Generate an optimized conversation history for AI context
   * @param {string} conversationId - The conversation ID
   * @param {number} maxTokens - Maximum tokens to include
   * @returns {Array} - Optimized conversation history
   */
  generateAIContextHistory(conversationId, maxTokens = 4000) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return [];
    }
    
    const messages = [...conversation.messages];
    
    // Start with most recent messages and work backwards
    messages.reverse();
    
    const result = [];
    let estimatedTokens = 0;
    const tokensPerMessage = 100; // Rough estimate of overhead per message
    
    for (const message of messages) {
      // Estimate tokens in this message
      const contentLength = message.content ? message.content.length : 0;
      const messageTokens = Math.ceil(contentLength / 4) + tokensPerMessage;
      
      // Check if adding this message would exceed the token limit
      if (estimatedTokens + messageTokens > maxTokens) {
        break;
      }
      
      // Add message to result and update token count
      result.unshift({
        role: message.role,
        content: message.content
      });
      
      estimatedTokens += messageTokens;
    }
    
    return result;
  }

  /**
   * Create a summary of the conversation
   * @param {string} conversationId - The conversation ID
   * @returns {string} - Conversation summary
   */
  createConversationSummary(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return '';
    }
    
    // Count messages by role
    const messageCounts = {
      user: 0,
      assistant: 0,
      system: 0
    };
    
    for (const message of conversation.messages) {
      if (messageCounts[message.role] !== undefined) {
        messageCounts[message.role]++;
      }
    }
    
    // Get first and last messages for context
    const firstMessage = conversation.messages[0];
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    
    // Create summary
    let summary = `# Conversation: ${conversation.title}\n\n`;
    summary += `- Started: ${new Date(conversation.createdAt).toLocaleString()}\n`;
    summary += `- Last updated: ${new Date(conversation.updatedAt).toLocaleString()}\n`;
    summary += `- Messages: ${conversation.messages.length} (${messageCounts.user} user, ${messageCounts.assistant} assistant)\n`;
    
    if (conversation.projectId) {
      summary += `- Project: ${conversation.projectId}\n`;
    }
    
    if (conversation.filePath) {
      summary += `- File: ${conversation.filePath}\n`;
    }
    
    // Add snippets of first and last messages
    if (firstMessage) {
      const firstContent = firstMessage.content || '';
      summary += `\n## Started with:\n${firstContent.substring(0, 150)}${firstContent.length > 150 ? '...' : ''}\n`;
    }
    
    if (lastMessage && lastMessage !== firstMessage) {
      const lastContent = lastMessage.content || '';
      summary += `\n## Most recent:\n${lastContent.substring(0, 150)}${lastContent.length > 150 ? '...' : ''}\n`;
    }
    
    return summary;
  }
}

module.exports = new ConversationManager(); // Export as singleton