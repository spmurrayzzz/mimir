import { computed } from 'vue';
import { useUIStore } from '../stores/uiStore';

export function useTheme() {
  const uiStore = useUIStore();
  
  // Computed properties
  const currentTheme = computed(() => uiStore.theme);
  const isDarkMode = computed(() => uiStore.isDarkMode);
  
  /**
   * Set the application theme
   * 
   * @param {string} theme - Theme to set ('light', 'dark', 'system')
   * @returns {boolean} Whether the theme was successfully set
   */
  const setTheme = (theme) => {
    return uiStore.setTheme(theme);
  };
  
  /**
   * Toggle between light and dark theme
   * If current theme is 'system', it will switch to explicit 'light' or 'dark'
   * 
   * @returns {string} The new theme value
   */
  const toggleTheme = () => {
    const newTheme = isDarkMode.value ? 'light' : 'dark';
    uiStore.setTheme(newTheme);
    return newTheme;
  };
  
  /**
   * Reset to system theme preference
   * 
   * @returns {boolean} Whether the theme was successfully set
   */
  const useSystemTheme = () => {
    return uiStore.setTheme('system');
  };
  
  /**
   * Apply theme-specific CSS variables
   * 
   * @param {Object} options - Theme options
   * @param {Object} options.lightColors - Light theme color values
   * @param {Object} options.darkColors - Dark theme color values
   */
  const applyThemeColors = ({ lightColors, darkColors }) => {
    const root = document.documentElement;
    const colors = isDarkMode.value ? darkColors : lightColors;
    
    // Apply each color as a CSS variable
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  };
  
  /**
   * Generate CSS classes based on current theme
   * 
   * @param {Object} options - Class options
   * @param {string} options.light - Class(es) to apply in light mode
   * @param {string} options.dark - Class(es) to apply in dark mode
   * @param {string} options.base - Class(es) to always apply
   * @returns {string} Combined CSS classes
   */
  const themeClasses = ({ light = '', dark = '', base = '' }) => {
    return [
      base,
      isDarkMode.value ? dark : light
    ].filter(Boolean).join(' ');
  };
  
  /**
   * Detect if system prefers dark mode
   * 
   * @returns {boolean} Whether system prefers dark mode
   */
  const systemPrefersDark = () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };
  
  /**
   * Initialize theme based on stored preference or system preference
   */
  const initTheme = () => {
    // Load theme from local storage or use system preference
    const storedTheme = localStorage.getItem('theme');
    
    if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
      uiStore.setTheme(storedTheme);
    } else {
      // Default to system theme if no preference is stored
      uiStore.setTheme('system');
    }
    
    // Apply the theme
    uiStore.applyTheme();
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (currentTheme.value === 'system') {
        uiStore.applyTheme();
      }
    });
  };
  
  return {
    // State
    currentTheme,
    isDarkMode,
    
    // Methods
    setTheme,
    toggleTheme,
    useSystemTheme,
    applyThemeColors,
    themeClasses,
    systemPrefersDark,
    initTheme
  };
}