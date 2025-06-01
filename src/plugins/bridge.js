import bridge from '../bridge';

/**
 * Bridge plugin for Vue
 * 
 * This plugin installs the bridge API onto the window object 
 * to replace the previous Electron API, and also makes it
 * available through Vue's app.config.globalProperties
 */
export default {
  /**
   * Install the plugin
   * @param {import('vue').App} app - The Vue application instance
   */
  install: (app) => {
    // Make bridge available as $bridge in Vue components
    app.config.globalProperties.$bridge = bridge;
    
    // Make bridge available globally as window.electronAPI for backward compatibility
    // This allows existing code to continue working without modifications
    window.electronAPI = bridge;
    
    // Log installation message
    console.info('Bridge API installed. This is a temporary compatibility layer that will be replaced with Tauri integration.');
  }
};