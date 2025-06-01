import { defineStore } from 'pinia';

export const useUIStore = defineStore('ui', {
  state: () => ({
    theme: 'system', // 'light', 'dark', or 'system'
    sidebarOpen: true,
    editorLayout: 'split', // 'split', 'editor-focus', 'chat-focus'
    editorSettings: {
      fontSize: 14,
      tabSize: 2,
      wordWrap: 'on',
      lineNumbers: 'on',
      minimap: true,
      autoSave: true,
      formatOnSave: true
    },
    notifications: [],
    confirmDialog: {
      open: false,
      title: '',
      message: '',
      confirmLabel: 'Confirm',
      cancelLabel: 'Cancel',
      confirmAction: null,
      cancelAction: null
    },
    lastRoute: '/',
    accessibilitySettings: {
      reducedMotion: false,
      highContrast: false,
      largeText: false
    },
    keyboardShortcuts: {
      toggleSidebar: 'Ctrl+B',
      newFile: 'Ctrl+N',
      save: 'Ctrl+S',
      runAI: 'Ctrl+Enter',
      focusEditor: 'Alt+E',
      focusChat: 'Alt+C'
    }
  }),
  
  getters: {
    isDarkMode: (state) => {
      if (state.theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      return state.theme === 'dark';
    },
    
    activeLayout: (state) => {
      return state.editorLayout;
    },
    
    currentNotification: (state) => {
      return state.notifications[0] || null;
    },
    
    hasPendingNotifications: (state) => {
      return state.notifications.length > 0;
    }
  },
  
  actions: {
    setTheme(theme) {
      if (['light', 'dark', 'system'].includes(theme)) {
        this.theme = theme;
        this.applyTheme();
        return true;
      }
      return false;
    },
    
    applyTheme() {
      const isDark = this.isDarkMode;
      
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Store the preference
      localStorage.setItem('theme', this.theme);
    },
    
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },
    
    setSidebarOpen(isOpen) {
      this.sidebarOpen = isOpen;
    },
    
    setEditorLayout(layout) {
      if (['split', 'editor-focus', 'chat-focus'].includes(layout)) {
        this.editorLayout = layout;
        return true;
      }
      return false;
    },
    
    updateEditorSettings(settings) {
      this.editorSettings = {
        ...this.editorSettings,
        ...settings
      };
    },
    
    addNotification(notification) {
      const id = notification.id || Date.now().toString(36) + Math.random().toString(36).substr(2);
      
      const newNotification = {
        id,
        type: notification.type || 'info',
        title: notification.title || '',
        message: notification.message || '',
        duration: notification.duration !== undefined ? notification.duration : 5000,
        timestamp: new Date().toISOString(),
        ...notification
      };
      
      // Add to notifications queue
      this.notifications.push(newNotification);
      
      // Auto-dismiss if duration is set
      if (newNotification.duration > 0) {
        setTimeout(() => {
          this.removeNotification(id);
        }, newNotification.duration);
      }
      
      return id;
    },
    
    removeNotification(id) {
      const index = this.notifications.findIndex(n => n.id === id);
      if (index !== -1) {
        this.notifications.splice(index, 1);
        return true;
      }
      return false;
    },
    
    clearNotifications() {
      this.notifications = [];
    },
    
    showConfirmDialog({ title, message, confirmLabel, cancelLabel, confirmAction, cancelAction }) {
      this.confirmDialog = {
        open: true,
        title: title || 'Confirm',
        message: message || 'Are you sure?',
        confirmLabel: confirmLabel || 'Confirm',
        cancelLabel: cancelLabel || 'Cancel',
        confirmAction: confirmAction || null,
        cancelAction: cancelAction || null
      };
    },
    
    closeConfirmDialog(confirmed = false) {
      const { confirmAction, cancelAction } = this.confirmDialog;
      
      // Reset dialog state
      this.confirmDialog = {
        open: false,
        title: '',
        message: '',
        confirmLabel: 'Confirm',
        cancelLabel: 'Cancel',
        confirmAction: null,
        cancelAction: null
      };
      
      // Execute callback if provided
      if (confirmed && typeof confirmAction === 'function') {
        confirmAction();
      } else if (!confirmed && typeof cancelAction === 'function') {
        cancelAction();
      }
    },
    
    setLastRoute(route) {
      this.lastRoute = route;
    },
    
    updateAccessibilitySettings(settings) {
      this.accessibilitySettings = {
        ...this.accessibilitySettings,
        ...settings
      };
      
      // Apply accessibility settings
      if (this.accessibilitySettings.reducedMotion) {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
      
      if (this.accessibilitySettings.highContrast) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
      
      if (this.accessibilitySettings.largeText) {
        document.documentElement.classList.add('large-text');
      } else {
        document.documentElement.classList.remove('large-text');
      }
    },
    
    updateKeyboardShortcut(key, shortcut) {
      if (key in this.keyboardShortcuts) {
        this.keyboardShortcuts[key] = shortcut;
        return true;
      }
      return false;
    },
    
    resetToDefaults() {
      // Reset theme
      this.theme = 'system';
      this.applyTheme();
      
      // Reset editor settings
      this.editorSettings = {
        fontSize: 14,
        tabSize: 2,
        wordWrap: 'on',
        lineNumbers: 'on',
        minimap: true,
        autoSave: true,
        formatOnSave: true
      };
      
      // Reset accessibility settings
      this.updateAccessibilitySettings({
        reducedMotion: false,
        highContrast: false,
        largeText: false
      });
      
      // Reset keyboard shortcuts
      this.keyboardShortcuts = {
        toggleSidebar: 'Ctrl+B',
        newFile: 'Ctrl+N',
        save: 'Ctrl+S',
        runAI: 'Ctrl+Enter',
        focusEditor: 'Alt+E',
        focusChat: 'Alt+C'
      };
    },
    
    async saveSettings() {
      try {
        // This would typically use the Electron IPC to save to database
        const result = await window.electronAPI.saveUISettings({
          theme: this.theme,
          editorSettings: this.editorSettings,
          accessibilitySettings: this.accessibilitySettings,
          keyboardShortcuts: this.keyboardShortcuts
        });
        
        return result.success;
      } catch (error) {
        console.error('Error saving UI settings:', error);
        return false;
      }
    },
    
    async loadSettings() {
      try {
        // This would typically use the Electron IPC to load from database
        const result = await window.electronAPI.getUISettings();
        
        if (result.success) {
          // Update theme
          if (result.settings.theme) {
            this.theme = result.settings.theme;
            this.applyTheme();
          }
          
          // Update editor settings
          if (result.settings.editorSettings) {
            this.editorSettings = {
              ...this.editorSettings,
              ...result.settings.editorSettings
            };
          }
          
          // Update accessibility settings
          if (result.settings.accessibilitySettings) {
            this.updateAccessibilitySettings(result.settings.accessibilitySettings);
          }
          
          // Update keyboard shortcuts
          if (result.settings.keyboardShortcuts) {
            this.keyboardShortcuts = {
              ...this.keyboardShortcuts,
              ...result.settings.keyboardShortcuts
            };
          }
          
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('Error loading UI settings:', error);
        return false;
      }
    },
    
    // Initialize UI store
    init() {
      // Apply theme based on stored preference or system preference
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme) {
        this.theme = storedTheme;
      }
      
      this.applyTheme();
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => {
        if (this.theme === 'system') {
          this.applyTheme();
        }
      });
    }
  }
});