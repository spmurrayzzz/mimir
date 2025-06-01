import { onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUIStore } from '../stores/uiStore';

// Default keyboard shortcuts
export const defaultShortcuts = {
  newProject: 'Ctrl+N',
  openProject: 'Ctrl+O',
  saveProject: 'Ctrl+S',
  runCode: 'Ctrl+R',
  toggleSidebar: 'Ctrl+B',
  focusEditor: 'Ctrl+E',
  focusChat: 'Ctrl+T',
  newChat: 'Ctrl+Shift+N',
  clearChat: 'Ctrl+L'
};

export function useKeyboardShortcuts() {
  const uiStore = useUIStore();
  const router = useRouter();
  
  // Computed properties
  const shortcuts = computed(() => uiStore.keyboardShortcuts);
  
  // Parse key combination string (e.g., "Ctrl+S" -> { ctrl: true, key: "s" })
  const parseKeyCombination = (combination) => {
    const parts = combination.split('+');
    const key = parts.pop().toLowerCase();
    const ctrl = parts.some(part => part.toLowerCase() === 'ctrl');
    const alt = parts.some(part => part.toLowerCase() === 'alt');
    const shift = parts.some(part => part.toLowerCase() === 'shift');
    const meta = parts.some(part => part.toLowerCase() === 'meta');
    
    return { key, ctrl, alt, shift, meta };
  };
  
  // Check if event matches a key combination
  const matchesKeyCombination = (event, combination) => {
    const parsed = parseKeyCombination(combination);
    
    return (
      event.key.toLowerCase() === parsed.key &&
      event.ctrlKey === parsed.ctrl &&
      event.altKey === parsed.alt &&
      event.shiftKey === parsed.shift &&
      event.metaKey === parsed.meta
    );
  };
  
  // Handle keydown events
  const handleKeyDown = (event) => {
    // Skip if within input elements
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) {
      return;
    }
    
    // Check each shortcut
    const shortcutEntries = Object.entries(shortcuts.value);
    
    for (const [action, combination] of shortcutEntries) {
      if (matchesKeyCombination(event, combination)) {
        event.preventDefault();
        executeAction(action);
        break;
      }
    }
  };
  
  // Execute action based on shortcut
  const executeAction = (action) => {
    switch (action) {
      // Navigation shortcuts
      case 'toggleSidebar':
        uiStore.toggleSidebar();
        break;
        
      // Project management shortcuts
      case 'newProject':
        router.push('/projects');
        setTimeout(() => {
          // Trigger the create new project dialog via event
          window.dispatchEvent(new CustomEvent('mimir:create-project'));
        }, 100);
        break;
        
      case 'openProject':
        router.push('/projects');
        break;
        
      case 'saveProject':
        // Save current project
        window.electronAPI.saveCurrentProject();
        break;
        
      // Editor shortcuts
      case 'runCode':
        window.electronAPI.runCurrentCode();
        break;
        
      case 'focusEditor':
        window.electronAPI.focusEditor();
        break;
        
      // Chat shortcuts
      case 'focusChat':
        window.electronAPI.focusChat();
        break;
        
      case 'newChat':
        window.electronAPI.createNewChat();
        break;
        
      case 'clearChat':
        window.electronAPI.clearCurrentChat();
        break;
        
      // Navigation shortcuts
      case 'goToHome':
        router.push('/');
        break;
        
      case 'goToProjects':
        router.push('/projects');
        break;
        
      case 'goToSettings':
        router.push('/settings');
        break;
        
      default:
        console.warn(`No action defined for shortcut: ${action}`);
    }
  };
  
  // Register and unregister global event listeners
  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
  });
  
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });
  
  /**
   * Update a keyboard shortcut
   * 
   * @param {string} action - The action name
   * @param {string} combination - The key combination (e.g., "Ctrl+S")
   * @returns {boolean} Whether the shortcut was successfully updated
   */
  const updateShortcut = (action, combination) => {
    return uiStore.updateKeyboardShortcut(action, combination);
  };
  
  /**
   * Check if a key combination conflicts with existing shortcuts
   * 
   * @param {string} combination - The key combination to check
   * @param {string} [excludeAction] - Action to exclude from conflict check
   * @returns {string|null} The conflicting action or null if no conflict
   */
  const checkConflicts = (combination, excludeAction = null) => {
    const entries = Object.entries(shortcuts.value);
    
    for (const [action, existingCombo] of entries) {
      if (action !== excludeAction && existingCombo === combination) {
        return action;
      }
    }
    
    return null;
  };
  
  /**
   * Get a user-friendly display text for a key combination
   * 
   * @param {string} combination - The key combination
   * @returns {string} User-friendly display text
   */
  const getDisplayText = (combination) => {
    // Replace with platform-specific key names
    return combination
      .replace('Ctrl', navigator.platform.includes('Mac') ? '⌘' : 'Ctrl')
      .replace('Alt', navigator.platform.includes('Mac') ? '⌥' : 'Alt')
      .replace('Shift', navigator.platform.includes('Mac') ? '⇧' : 'Shift')
      .replace('Meta', navigator.platform.includes('Mac') ? '⌘' : 'Win');
  };
  
  /**
   * Reset all shortcuts to default values
   */
  const resetToDefaults = () => {
    uiStore.resetToDefaults();
  };
  
  return {
    // State
    shortcuts,
    
    // Methods
    updateShortcut,
    checkConflicts,
    getDisplayText,
    resetToDefaults,
    executeAction
  };
}