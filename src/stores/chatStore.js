import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';

export const useChatStore = defineStore('chat', {
  state: () => ({
    conversations: [],
    activeConversationId: null,
    isStreaming: false,
    tokenCounts: {
      input: 0,
      output: 0,
      max: 4096,
      cost: 0
    },
    responseTime: 0,
    autoApplyCode: false
  }),
  
  getters: {
    activeConversation: (state) => {
      if (!state.activeConversationId) return null;
      return state.conversations.find(conv => conv.id === state.activeConversationId);
    },
    
    activeMessages: (state) => {
      const conversation = state.conversations.find(
        conv => conv.id === state.activeConversationId
      );
      return conversation ? conversation.messages : [];
    },
    
    getConversationById: (state) => (id) => {
      return state.conversations.find(conv => conv.id === id);
    },
    
    latestCodeMessage: (state) => {
      const conversation = state.conversations.find(
        conv => conv.id === state.activeConversationId
      );
      
      if (!conversation) return null;
      
      // Find the latest code message from the assistant
      for (let i = conversation.messages.length - 1; i >= 0; i--) {
        const msg = conversation.messages[i];
        if (msg.role === 'assistant' && (msg.type === 'code' || msg.language)) {
          return msg;
        }
      }
      
      return null;
    }
  },
  
  actions: {
    createConversation(projectId = null, title = 'New Conversation') {
      const id = uuidv4();
      const conversation = {
        id,
        projectId,
        title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      };
      
      this.conversations.push(conversation);
      this.activeConversationId = id;
      
      // Reset token counts for new conversation
      this.tokenCounts = {
        input: 0,
        output: 0,
        max: 4096,
        cost: 0
      };
      
      return conversation;
    },
    
    setActiveConversation(id) {
      this.activeConversationId = id;
    },
    
    addMessage(message) {
      const conversation = this.conversations.find(
        conv => conv.id === this.activeConversationId
      );
      
      if (!conversation) return null;
      
      // Add a unique ID and timestamp if not provided
      const newMessage = {
        id: message.id || uuidv4(),
        timestamp: message.timestamp || new Date().toISOString(),
        ...message
      };
      
      conversation.messages.push(newMessage);
      conversation.updatedAt = new Date().toISOString();
      
      // Update title for new conversations based on first user message
      if (conversation.messages.length === 1 && message.role === 'user') {
        conversation.title = message.content.substring(0, 30) + (message.content.length > 30 ? '...' : '');
      }
      
      return newMessage;
    },
    
    updateMessage(id, updates) {
      const conversation = this.conversations.find(
        conv => conv.id === this.activeConversationId
      );
      
      if (!conversation) return false;
      
      const messageIndex = conversation.messages.findIndex(msg => msg.id === id);
      if (messageIndex === -1) return false;
      
      conversation.messages[messageIndex] = {
        ...conversation.messages[messageIndex],
        ...updates
      };
      
      conversation.updatedAt = new Date().toISOString();
      return true;
    },
    
    removeMessage(id) {
      const conversation = this.conversations.find(
        conv => conv.id === this.activeConversationId
      );
      
      if (!conversation) return false;
      
      const initialLength = conversation.messages.length;
      conversation.messages = conversation.messages.filter(msg => msg.id !== id);
      
      if (conversation.messages.length !== initialLength) {
        conversation.updatedAt = new Date().toISOString();
        return true;
      }
      
      return false;
    },
    
    clearConversation() {
      const conversation = this.conversations.find(
        conv => conv.id === this.activeConversationId
      );
      
      if (!conversation) return false;
      
      conversation.messages = [];
      conversation.updatedAt = new Date().toISOString();
      
      // Reset token counts
      this.tokenCounts = {
        input: 0,
        output: 0,
        max: 4096,
        cost: 0
      };
      
      return true;
    },
    
    deleteConversation(id) {
      const targetId = id || this.activeConversationId;
      if (!targetId) return false;
      
      const initialLength = this.conversations.length;
      this.conversations = this.conversations.filter(conv => conv.id !== targetId);
      
      if (this.conversations.length !== initialLength) {
        // If we deleted the active conversation, set a new active one
        if (targetId === this.activeConversationId) {
          this.activeConversationId = this.conversations.length > 0 
            ? this.conversations[0].id 
            : null;
        }
        return true;
      }
      
      return false;
    },
    
    setStreaming(isStreaming) {
      this.isStreaming = isStreaming;
    },
    
    updateTokenCounts(counts) {
      this.tokenCounts = {
        ...this.tokenCounts,
        ...counts
      };
    },
    
    setResponseTime(time) {
      this.responseTime = time;
    },
    
    setAutoApplyCode(value) {
      this.autoApplyCode = value;
    },
    
    async saveConversations() {
      try {
        // This would typically use the Electron IPC to save to database
        const result = await window.electronAPI.saveConversations(this.conversations);
        return result.success;
      } catch (error) {
        console.error('Error saving conversations:', error);
        return false;
      }
    },
    
    async loadConversations() {
      try {
        // This would typically use the Electron IPC to load from database
        const result = await window.electronAPI.getConversations();
        
        if (result.success) {
          this.conversations = result.conversations;
          
          // Set active conversation if there are any
          if (this.conversations.length > 0 && !this.activeConversationId) {
            this.activeConversationId = this.conversations[0].id;
          }
          
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('Error loading conversations:', error);
        return false;
      }
    }
  }
});