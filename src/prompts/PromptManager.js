/**
 * Prompt Management System
 * Handles prompt templates, context injection, and token management
 */

const path = require('path');
const fs = require('fs');

// Import prompt templates
const systemPrompt = require('./templates/systemPrompt');
const codeGenerationTemplate = require('./templates/codeGeneration');
const bugFixTemplate = require('./templates/bugFix');
const codeExplanationTemplate = require('./templates/codeExplanation');

class PromptManager {
  constructor() {
    this.templates = {
      system: systemPrompt,
      codeGeneration: codeGenerationTemplate,
      bugFix: bugFixTemplate,
      codeExplanation: codeExplanationTemplate
    };
    
    // Special action tags
    this.actionTags = {
      write: {
        start: '<mimir-write',
        end: '</mimir-write>'
      },
      chatSummary: {
        start: '<mimir-chat-summary>',
        end: '</mimir-chat-summary>'
      },
      rename: {
        start: '<mimir-rename',
        end: '</mimir-rename>'
      },
      delete: {
        start: '<mimir-delete',
        end: '</mimir-delete>'
      },
      addDependency: {
        start: '<mimir-add-dependency',
        end: '</mimir-add-dependency>'
      }
    };
    
    // Default token limits
    this.tokenLimits = {
      max: 16000,
      systemPrompt: 2000,
      userMessage: 8000,
      fileContext: 5000,
      responseBuffer: 1000
    };
  }

  /**
   * Format a prompt template with variables
   * @param {string} templateName - Name of the template to use
   * @param {Object} variables - Variables to inject into the template
   * @returns {string} - Formatted prompt
   */
  formatTemplate(templateName, variables = {}) {
    if (!this.templates[templateName]) {
      throw new Error(`Unknown prompt template: ${templateName}`);
    }
    
    let result = this.templates[templateName];
    
    // Replace all variables in the template
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value || '');
    }
    
    // Remove any remaining placeholders
    result = result.replace(/{[a-zA-Z0-9_]+}/g, '');
    
    return result;
  }

  /**
   * Create a complete prompt with system message and user query
   * @param {string} userQuery - The user's question or request
   * @param {Object} options - Additional options
   * @returns {Object} - The complete prompt object
   */
  createPrompt(userQuery, options = {}) {
    const {
      templateName = 'system',
      templateVariables = {},
      codeContext = [],
      conversationHistory = [],
      projectContext = '',
      temperature = 0.7,
      maxTokens = 1024
    } = options;
    
    // Format the system prompt
    const systemMessage = this.formatTemplate(templateName, templateVariables);
    
    // Create messages array with system prompt
    const messages = [
      { role: 'system', content: systemMessage }
    ];
    
    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      // Optimize token usage by limiting history if needed
      const optimizedHistory = this.optimizeConversationHistory(conversationHistory);
      messages.push(...optimizedHistory);
    }
    
    // Prepare code context
    let codeContextStr = '';
    if (codeContext && codeContext.length > 0) {
      codeContextStr = this.prepareCodeContext(codeContext);
    }
    
    // Prepare project context
    let projectContextStr = '';
    if (projectContext) {
      projectContextStr = `\n# Project Context\n${projectContext}\n`;
    }
    
    // Combine everything for the user message
    const fullUserQuery = `${projectContextStr}\n${codeContextStr}\n${userQuery}`;
    
    // Add user query
    messages.push({ role: 'user', content: fullUserQuery });
    
    return {
      messages,
      temperature,
      maxTokens
    };
  }

  /**
   * Optimize conversation history to fit within token limits
   * @param {Array} history - Full conversation history
   * @returns {Array} - Optimized conversation history
   */
  optimizeConversationHistory(history) {
    // Simple optimization: keep only the last 5 exchanges
    // In a real implementation, you'd use token counting and more sophisticated algorithms
    if (history.length <= 5) {
      return history;
    }
    
    return history.slice(-5);
  }

  /**
   * Prepare code context for inclusion in the prompt
   * @param {Array} codeContext - Array of code context objects
   * @returns {string} - Formatted code context
   */
  prepareCodeContext(codeContext) {
    let result = '# Code Context\n\n';
    
    for (const context of codeContext) {
      const { fileName, language, code, path: filePath } = context;
      result += `## File: ${fileName || filePath}\n\n`;
      result += '```' + (language || 'javascript') + '\n';
      result += code + '\n';
      result += '```\n\n';
    }
    
    return result;
  }

  /**
   * Extract special action tags from AI response
   * @param {string} response - The AI response text
   * @returns {Object} - Extracted actions and cleaned response
   */
  extractActionTags(response) {
    let cleanedResponse = response;
    const actions = {
      write: [],
      chatSummary: [],
      rename: [],
      delete: [],
      addDependency: []
    };
    
    // Extract write actions
    const writeRegex = new RegExp(`${this.actionTags.write.start}[^>]*path="([^"]+)"[^>]*>(.*?)${this.actionTags.write.end}`, 'gs');
    let writeMatch;
    while ((writeMatch = writeRegex.exec(response)) !== null) {
      const filePath = writeMatch[1];
      const content = writeMatch[2].trim();
      actions.write.push({ path: filePath, content });
      cleanedResponse = cleanedResponse.replace(writeMatch[0], `[Writing to ${filePath}]`);
    }
    
    // Extract chat summary
    const summaryRegex = new RegExp(`${this.actionTags.chatSummary.start}(.*?)${this.actionTags.chatSummary.end}`, 'gs');
    let summaryMatch;
    while ((summaryMatch = summaryRegex.exec(response)) !== null) {
      const summary = summaryMatch[1].trim();
      actions.chatSummary.push({ summary });
      cleanedResponse = cleanedResponse.replace(summaryMatch[0], '[Chat summary created]');
    }
    
    // Extract rename actions
    const renameRegex = new RegExp(`${this.actionTags.rename.start}[^>]*from="([^"]+)"[^>]*to="([^"]+)"[^>]*>(.*?)${this.actionTags.rename.end}`, 'gs');
    let renameMatch;
    while ((renameMatch = renameRegex.exec(response)) !== null) {
      const fromPath = renameMatch[1];
      const toPath = renameMatch[2];
      const reason = renameMatch[3].trim();
      actions.rename.push({ from: fromPath, to: toPath, reason });
      cleanedResponse = cleanedResponse.replace(renameMatch[0], `[Renaming ${fromPath} to ${toPath}]`);
    }
    
    // Extract delete actions
    const deleteRegex = new RegExp(`${this.actionTags.delete.start}[^>]*path="([^"]+)"[^>]*>(.*?)${this.actionTags.delete.end}`, 'gs');
    let deleteMatch;
    while ((deleteMatch = deleteRegex.exec(response)) !== null) {
      const filePath = deleteMatch[1];
      const reason = deleteMatch[2].trim();
      actions.delete.push({ path: filePath, reason });
      cleanedResponse = cleanedResponse.replace(deleteMatch[0], `[Deleting ${filePath}]`);
    }
    
    // Extract add dependency actions
    const dependencyRegex = new RegExp(`${this.actionTags.addDependency.start}[^>]*name="([^"]+)"[^>]*version="([^"]+)"[^>]*dev="([^"]+)"[^>]*>(.*?)${this.actionTags.addDependency.end}`, 'gs');
    let dependencyMatch;
    while ((dependencyMatch = dependencyRegex.exec(response)) !== null) {
      const name = dependencyMatch[1];
      const version = dependencyMatch[2];
      const isDev = dependencyMatch[3] === 'true';
      const reason = dependencyMatch[4].trim();
      actions.addDependency.push({ name, version, isDev, reason });
      cleanedResponse = cleanedResponse.replace(dependencyMatch[0], `[Adding dependency ${name}@${version}]`);
    }
    
    return { actions, cleanedResponse };
  }

  /**
   * Estimate token count for a prompt
   * @param {Object} prompt - The prompt object
   * @returns {number} - Estimated token count
   */
  estimateTokenCount(prompt) {
    // Simple estimation: ~4 characters per token for English text
    let totalChars = 0;
    
    for (const message of prompt.messages) {
      totalChars += message.content.length;
    }
    
    return Math.ceil(totalChars / 4);
  }

  /**
   * Load a custom prompt template from a file
   * @param {string} filePath - Path to the template file
   * @param {string} templateName - Name to assign to the template
   * @returns {boolean} - Success
   */
  loadTemplateFromFile(filePath, templateName) {
    try {
      const template = require(filePath);
      this.templates[templateName] = template;
      return true;
    } catch (error) {
      console.error(`Error loading template from ${filePath}:`, error);
      return false;
    }
  }
}

module.exports = new PromptManager(); // Export as singleton