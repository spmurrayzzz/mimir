import { defineStore } from 'pinia';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    theme: 'dark',
    editor: {
      fontSize: 14,
      tabSize: 2,
      wordWrap: true,
      minimap: true,
      lineNumbers: true,
      formatOnSave: true
    },
    ai: {
      defaultCompletionModel: 'gpt-4',
      defaultCodeModel: 'claude-3-haiku-20240307',
      temperature: 0.7,
      maxTokens: 2048,
      providers: {
        openai: {
          enabled: true,
          defaultModel: 'gpt-4-0125-preview',
          isDefault: true,
          baseURL: null
        },
        anthropic: {
          enabled: true,
          defaultModel: 'claude-3-haiku-20240307',
          isDefault: false,
          baseURL: null
        },
        google: {
          enabled: true,
          defaultModel: 'gemini-1.0-pro',
          isDefault: false
        },
        ollama: {
          enabled: false,
          defaultModel: 'llama3',
          isDefault: false,
          baseUrl: 'http://localhost:11434'
        },
        lmstudio: {
          enabled: false,
          defaultModel: 'default',
          isDefault: false,
          baseUrl: 'http://localhost:1234/v1'
        }
      },
      defaultProvider: 'openai',
      streamResponses: true,
      actionTags: true,
      saveConversations: true,
      tokenUsageTracking: true
    },
    isLoading: false,
    error: null
  }),
  
  actions: {
    async loadSettings() {
      this.isLoading = true;
      this.error = null;
      
      try {
        // Call electron API to load settings from database
        const result = await window.electronAPI.getSettings();
        
        if (result && result.success) {
          // Update theme
          if (result.settings.theme) {
            this.setTheme(result.settings.theme);
          }
          
          // Update editor settings
          if (result.settings.editor) {
            this.editor = { ...this.editor, ...result.settings.editor };
          }
          
          // Update AI settings
          if (result.settings.ai) {
            this.ai = { ...this.ai, ...result.settings.ai };
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        this.error = error.message;
      } finally {
        this.isLoading = false;
      }
    },
    
    async saveSettings() {
      this.isLoading = true;
      this.error = null;
      
      try {
        // Prepare settings object
        const settings = {
          theme: this.theme,
          editor: this.editor,
          ai: this.ai
        };
        
        // Call electron API to save settings to database
        const result = await window.electronAPI.saveSettings(settings);
        
        if (!result || !result.success) {
          throw new Error(result?.error || 'Failed to save settings');
        }
      } catch (error) {
        console.error('Error saving settings:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    
    setTheme(theme) {
      this.theme = theme;
      
      // Apply theme to document
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }
});