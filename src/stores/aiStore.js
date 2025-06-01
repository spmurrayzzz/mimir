import { defineStore } from 'pinia';

export const useAIStore = defineStore('ai', {
  state: () => ({
    providers: [
      {
        id: 'openai',
        name: 'OpenAI',
        enabled: true,
        apiKey: '',
        baseUrl: 'https://api.openai.com/v1',
        models: [
          { id: 'gpt-4o', name: 'GPT-4o', maxTokens: 8192, enabled: true },
          { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', maxTokens: 8192, enabled: true },
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', maxTokens: 4096, enabled: true }
        ],
        defaultModel: 'gpt-4o'
      },
      {
        id: 'anthropic',
        name: 'Anthropic',
        enabled: false,
        apiKey: '',
        baseUrl: 'https://api.anthropic.com',
        models: [
          { id: 'claude-3-opus', name: 'Claude 3 Opus', maxTokens: 8192, enabled: true },
          { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', maxTokens: 8192, enabled: true },
          { id: 'claude-3-haiku', name: 'Claude 3 Haiku', maxTokens: 4096, enabled: true }
        ],
        defaultModel: 'claude-3-sonnet'
      },
      {
        id: 'google',
        name: 'Google AI',
        enabled: false,
        apiKey: '',
        baseUrl: 'https://generativelanguage.googleapis.com',
        models: [
          { id: 'gemini-pro', name: 'Gemini Pro', maxTokens: 8192, enabled: true }
        ],
        defaultModel: 'gemini-pro'
      },
      {
        id: 'ollama',
        name: 'Ollama',
        enabled: false,
        baseUrl: 'http://localhost:11434',
        models: [
          { id: 'llama3', name: 'Llama 3', maxTokens: 4096, enabled: true },
          { id: 'mistral', name: 'Mistral', maxTokens: 4096, enabled: true },
          { id: 'codellama', name: 'CodeLlama', maxTokens: 4096, enabled: true }
        ],
        defaultModel: 'codellama'
      },
      {
        id: 'lmstudio',
        name: 'LM Studio',
        enabled: false,
        baseUrl: 'http://localhost:1234',
        models: [
          { id: 'local-model', name: 'Local Model', maxTokens: 4096, enabled: true }
        ],
        defaultModel: 'local-model'
      }
    ],
    activeProviderId: 'openai',
    activeModelId: 'gpt-4o',
    settings: {
      temperature: 0.7,
      topP: 0.95,
      maxTokens: 4096,
      presencePenalty: 0,
      frequencyPenalty: 0,
      streamResponses: true,
      systemPrompt: 'You are a helpful AI coding assistant.',
      autoCodeMode: 'suggest' // 'suggest', 'auto', 'off'
    }
  }),
  
  getters: {
    activeProvider: (state) => {
      return state.providers.find(provider => provider.id === state.activeProviderId) || state.providers[0];
    },
    
    activeModel: (state) => {
      const provider = state.providers.find(provider => provider.id === state.activeProviderId);
      if (!provider) return null;
      
      return provider.models.find(model => model.id === state.activeModelId) 
        || provider.models.find(model => model.id === provider.defaultModel) 
        || provider.models[0];
    },
    
    enabledProviders: (state) => {
      return state.providers.filter(provider => provider.enabled);
    },
    
    providerModels: (state) => (providerId) => {
      const provider = state.providers.find(p => p.id === providerId);
      return provider ? provider.models.filter(model => model.enabled) : [];
    },
    
    hasApiKey: (state) => {
      const provider = state.providers.find(p => p.id === state.activeProviderId);
      // Some providers like Ollama and LM Studio don't need API keys
      if (['ollama', 'lmstudio'].includes(provider.id)) return true;
      return !!provider?.apiKey;
    }
  },
  
  actions: {
    setActiveProvider(providerId) {
      const provider = this.providers.find(p => p.id === providerId);
      if (!provider) return false;
      
      this.activeProviderId = providerId;
      
      // Set active model to provider's default
      this.activeModelId = provider.defaultModel;
      
      return true;
    },
    
    setActiveModel(modelId) {
      const provider = this.providers.find(p => p.id === this.activeProviderId);
      if (!provider) return false;
      
      const model = provider.models.find(m => m.id === modelId);
      if (!model) return false;
      
      this.activeModelId = modelId;
      return true;
    },
    
    updateProvider(providerId, updates) {
      const index = this.providers.findIndex(p => p.id === providerId);
      if (index === -1) return false;
      
      this.providers[index] = {
        ...this.providers[index],
        ...updates
      };
      
      return true;
    },
    
    updateModel(providerId, modelId, updates) {
      const providerIndex = this.providers.findIndex(p => p.id === providerId);
      if (providerIndex === -1) return false;
      
      const modelIndex = this.providers[providerIndex].models.findIndex(m => m.id === modelId);
      if (modelIndex === -1) return false;
      
      this.providers[providerIndex].models[modelIndex] = {
        ...this.providers[providerIndex].models[modelIndex],
        ...updates
      };
      
      return true;
    },
    
    updateSettings(updates) {
      this.settings = {
        ...this.settings,
        ...updates
      };
    },
    
    addCustomModel(providerId, model) {
      const providerIndex = this.providers.findIndex(p => p.id === providerId);
      if (providerIndex === -1) return false;
      
      // Ensure model has required properties
      const newModel = {
        id: model.id || `custom-${Date.now()}`,
        name: model.name || 'Custom Model',
        maxTokens: model.maxTokens || 4096,
        enabled: true,
        ...model
      };
      
      this.providers[providerIndex].models.push(newModel);
      return true;
    },
    
    removeCustomModel(providerId, modelId) {
      const providerIndex = this.providers.findIndex(p => p.id === providerId);
      if (providerIndex === -1) return false;
      
      const initialLength = this.providers[providerIndex].models.length;
      this.providers[providerIndex].models = this.providers[providerIndex].models.filter(m => m.id !== modelId);
      
      // If we removed the active model, set it to the default
      if (modelId === this.activeModelId && this.activeProviderId === providerId) {
        this.activeModelId = this.providers[providerIndex].defaultModel;
      }
      
      return this.providers[providerIndex].models.length !== initialLength;
    },
    
    async saveSettings() {
      try {
        // This would typically use the Electron IPC to save to database
        const result = await window.electronAPI.saveAISettings({
          providers: this.providers,
          activeProviderId: this.activeProviderId,
          activeModelId: this.activeModelId,
          settings: this.settings
        });
        
        return result.success;
      } catch (error) {
        console.error('Error saving AI settings:', error);
        return false;
      }
    },
    
    async loadSettings() {
      try {
        // This would typically use the Electron IPC to load from database
        const result = await window.electronAPI.getAISettings();
        
        if (result.success) {
          // Update providers while preserving structure
          if (result.settings.providers) {
            this.providers = result.settings.providers;
          }
          
          // Update active provider and model
          if (result.settings.activeProviderId) {
            this.activeProviderId = result.settings.activeProviderId;
          }
          
          if (result.settings.activeModelId) {
            this.activeModelId = result.settings.activeModelId;
          }
          
          // Update settings
          if (result.settings.settings) {
            this.settings = {
              ...this.settings,
              ...result.settings.settings
            };
          }
          
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('Error loading AI settings:', error);
        return false;
      }
    }
  }
});