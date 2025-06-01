const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  openFile: () => ipcRenderer.invoke('file:open'),
  saveFile: (content) => ipcRenderer.invoke('file:save', content),
  saveFileAs: (content) => ipcRenderer.invoke('file:saveAs', content),
  
  // Database operations
  getProjects: () => ipcRenderer.invoke('db:getProjects'),
  getProject: (id) => ipcRenderer.invoke('db:getProject', id),
  saveProject: (project) => ipcRenderer.invoke('db:saveProject', project),
  deleteProject: (id) => ipcRenderer.invoke('db:deleteProject', id),
  
  // AI model operations
  initializeAI: (settings) =>
    ipcRenderer.invoke('ai:initialize', settings),
  generateCompletion: (prompt, options) =>
    ipcRenderer.invoke('ai:completion', prompt, options),
  generateCompletionStream: (prompt, options) =>
    ipcRenderer.invoke('ai:completionStream', prompt, options),
  cancelCompletionStream: (streamId) =>
    ipcRenderer.invoke('ai:cancelStream', streamId),
  generateCode: (prompt, options) =>
    ipcRenderer.invoke('ai:code', prompt, options),
  getAIProviders: () =>
    ipcRenderer.invoke('ai:getProviders'),
  setAPIKey: (providerType, apiKey) =>
    ipcRenderer.invoke('ai:setApiKey', providerType, apiKey),
  deleteAPIKey: (providerType) =>
    ipcRenderer.invoke('ai:deleteApiKey', providerType),
  setDefaultProvider: (providerType) =>
    ipcRenderer.invoke('ai:setDefaultProvider', providerType),
  checkProviderHealth: (providerType) =>
    ipcRenderer.invoke('ai:checkProviderHealth', providerType),
  getUsageStats: () =>
    ipcRenderer.invoke('ai:getUsageStats'),
  resetUsageStats: () =>
    ipcRenderer.invoke('ai:resetUsageStats'),
    
  // Conversation management
  createConversation: (options) =>
    ipcRenderer.invoke('ai:createConversation', options),
  getConversation: (conversationId) =>
    ipcRenderer.invoke('ai:getConversation', conversationId),
  getAllConversations: (filters) =>
    ipcRenderer.invoke('ai:getAllConversations', filters),
  addMessage: (conversationId, message) =>
    ipcRenderer.invoke('ai:addMessage', conversationId, message),
  deleteConversation: (conversationId) =>
    ipcRenderer.invoke('ai:deleteConversation', conversationId),
  updateContext: (conversationId, context) =>
    ipcRenderer.invoke('ai:updateContext', conversationId, context),
  processActions: (actions) =>
    ipcRenderer.invoke('ai:processActions', actions),
  loadConversations: () =>
    ipcRenderer.invoke('ai:loadConversations'),
  
  // System operations
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  getSystemInfo: () => ipcRenderer.invoke('system:info'),
  
  // Events
  onThemeChange: (callback) =>
    ipcRenderer.on('theme:changed', (_, value) => callback(value)),
  onStatusUpdate: (callback) =>
    ipcRenderer.on('status:update', (_, value) => callback(value)),
  onAIStream: (callback) =>
    ipcRenderer.on('ai:stream', (_, chunk) => callback(chunk)),
  onAIStreamComplete: (callback) =>
    ipcRenderer.on('ai:streamComplete', (_, result) => callback(result)),
  onAIStreamError: (callback) =>
    ipcRenderer.on('ai:streamError', (_, error) => callback(error)),
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('theme:changed');
    ipcRenderer.removeAllListeners('status:update');
    ipcRenderer.removeAllListeners('ai:stream');
    ipcRenderer.removeAllListeners('ai:streamComplete');
    ipcRenderer.removeAllListeners('ai:streamError');
  }
});