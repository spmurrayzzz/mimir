/**
 * AI Response Processor
 * Handles streaming response parsing, action tag extraction, and response optimization
 */

const EventEmitter = require('events');
const PromptManager = require('../../prompts/PromptManager');
const path = require('path');
const fs = require('fs');

class ResponseProcessor extends EventEmitter {
  constructor() {
    super();
    this.promptManager = PromptManager;
    this.responseCache = new Map();
    this.maxCacheSize = 50; // Maximum number of cached responses
  }

  /**
   * Process a streaming response
   * @param {Object} streamChunk - The chunk of data from the stream
   * @param {string} conversationId - The ID of the conversation
   * @param {function} onChunk - Callback for each processed chunk
   * @returns {Promise<void>}
   */
  async processStreamChunk(streamChunk, conversationId, onChunk) {
    try {
      if (!streamChunk) return;
      
      // Extract the text content
      const { text, done, error } = streamChunk;
      
      if (error) {
        this.emit('error', { error, conversationId });
        onChunk({ text: '', done: true, error });
        return;
      }
      
      // If this is the final chunk, process any actions
      if (done) {
        const fullResponse = this.getFullResponse(conversationId);
        if (fullResponse) {
          const { actions, cleanedResponse } = this.promptManager.extractActionTags(fullResponse);
          
          // Cache the processed response
          this.cacheResponse(conversationId, cleanedResponse);
          
          // Emit actions event
          if (Object.values(actions).some(arr => arr.length > 0)) {
            this.emit('actions', { actions, conversationId });
          }
          
          // Signal completion with cleaned response
          onChunk({ 
            text: '', 
            done: true, 
            fullResponse: cleanedResponse,
            actions,
            usage: streamChunk.usage || null
          });
        } else {
          onChunk({ text: '', done: true });
        }
        return;
      }
      
      // Store the chunk for the full response
      this.appendResponseChunk(conversationId, text);
      
      // Forward the chunk to the callback
      onChunk({ text, done: false });
    } catch (error) {
      console.error('Error processing stream chunk:', error);
      this.emit('error', { error, conversationId });
      onChunk({ text: '', done: true, error: error.message });
    }
  }

  /**
   * Append a chunk to the stored response
   * @param {string} conversationId - The ID of the conversation
   * @param {string} chunk - The text chunk
   * @private
   */
  appendResponseChunk(conversationId, chunk) {
    if (!this.responseCache.has(conversationId)) {
      this.responseCache.set(conversationId, '');
    }
    
    this.responseCache.set(
      conversationId, 
      this.responseCache.get(conversationId) + chunk
    );
  }

  /**
   * Get the full response for a conversation
   * @param {string} conversationId - The ID of the conversation
   * @returns {string|null} - The full response
   */
  getFullResponse(conversationId) {
    return this.responseCache.get(conversationId) || null;
  }

  /**
   * Cache a processed response
   * @param {string} conversationId - The ID of the conversation
   * @param {string} response - The processed response
   * @private
   */
  cacheResponse(conversationId, response) {
    // Implement LRU cache behavior - remove oldest entries if over limit
    if (this.responseCache.size >= this.maxCacheSize) {
      const oldestKey = this.responseCache.keys().next().value;
      this.responseCache.delete(oldestKey);
    }
    
    this.responseCache.set(conversationId, response);
  }

  /**
   * Clear the response cache for a conversation
   * @param {string} conversationId - The ID of the conversation
   */
  clearResponseCache(conversationId) {
    if (conversationId) {
      this.responseCache.delete(conversationId);
    } else {
      this.responseCache.clear();
    }
  }

  /**
   * Extract and validate code blocks from a response
   * @param {string} response - The AI response text
   * @returns {Array} - Array of extracted code blocks with language and content
   */
  extractCodeBlocks(response) {
    const codeBlocks = [];
    const codeBlockRegex = /```([a-zA-Z0-9_]+)?\n([\s\S]+?)\n```/g;
    
    let match;
    while ((match = codeBlockRegex.exec(response)) !== null) {
      const language = match[1] || 'text';
      const code = match[2].trim();
      
      codeBlocks.push({
        language,
        code
      });
    }
    
    return codeBlocks;
  }

  /**
   * Process file operations from actions
   * @param {Object} actions - The actions extracted from the response
   * @returns {Promise<Object>} - Results of file operations
   */
  async processFileOperations(actions) {
    const results = {
      write: [],
      rename: [],
      delete: [],
      dependency: []
    };
    
    try {
      // Process write operations
      for (const writeOp of actions.write || []) {
        try {
          const { path: filePath, content } = writeOp;
          
          // Create directory if it doesn't exist
          const dirPath = path.dirname(filePath);
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }
          
          // Write the file
          fs.writeFileSync(filePath, content, 'utf8');
          results.write.push({ path: filePath, success: true });
        } catch (error) {
          console.error(`Error processing write operation for ${writeOp.path}:`, error);
          results.write.push({ path: writeOp.path, success: false, error: error.message });
        }
      }
      
      // Process rename operations
      for (const renameOp of actions.rename || []) {
        try {
          const { from, to } = renameOp;
          
          // Create directory for destination if it doesn't exist
          const dirPath = path.dirname(to);
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }
          
          // Rename the file
          fs.renameSync(from, to);
          results.rename.push({ from, to, success: true });
        } catch (error) {
          console.error(`Error processing rename operation from ${renameOp.from} to ${renameOp.to}:`, error);
          results.rename.push({ from: renameOp.from, to: renameOp.to, success: false, error: error.message });
        }
      }
      
      // Process delete operations
      for (const deleteOp of actions.delete || []) {
        try {
          const { path: filePath } = deleteOp;
          
          // Delete the file
          fs.unlinkSync(filePath);
          results.delete.push({ path: filePath, success: true });
        } catch (error) {
          console.error(`Error processing delete operation for ${deleteOp.path}:`, error);
          results.delete.push({ path: deleteOp.path, success: false, error: error.message });
        }
      }
      
      // Note: Dependency operations would be handled by the package manager integration
      // This would typically involve updating package.json and running npm/yarn/pnpm
      
      return results;
    } catch (error) {
      console.error('Error processing file operations:', error);
      throw error;
    }
  }

  /**
   * Validate a code snippet for syntax errors
   * @param {string} code - The code to validate
   * @param {string} language - The programming language
   * @returns {Object} - Validation result
   */
  validateCode(code, language) {
    // Basic validation
    // In a real implementation, this would use language-specific parsers
    
    try {
      if (language === 'javascript' || language === 'typescript') {
        // Check for obvious syntax errors
        const errors = [];
        
        // Check for mismatched brackets
        const brackets = { '{': '}', '(': ')', '[': ']' };
        const stack = [];
        
        for (let i = 0; i < code.length; i++) {
          const char = code[i];
          if ('{(['.includes(char)) {
            stack.push(char);
          } else if ('})]'.includes(char)) {
            const last = stack.pop();
            if (!last || brackets[last] !== char) {
              errors.push(`Mismatched bracket at position ${i}: expected ${last ? brackets[last] : 'none'}, got ${char}`);
            }
          }
        }
        
        if (stack.length > 0) {
          errors.push(`Unclosed brackets: ${stack.map(b => brackets[b]).join(', ')}`);
        }
        
        return {
          valid: errors.length === 0,
          errors
        };
      }
      
      // For other languages, just return valid (would need language-specific validation)
      return { valid: true, errors: [] };
    } catch (error) {
      return {
        valid: false,
        errors: [error.message]
      };
    }
  }
}

module.exports = new ResponseProcessor(); // Export as singleton