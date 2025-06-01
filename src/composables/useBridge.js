import { ref } from 'vue';
import bridge from '../bridge';

/**
 * Composable that provides access to the application backend bridge
 * This is a wrapper around the bridge API that provides reactive state
 * and convenient methods for Vue components
 */
export function useBridge() {
  const isLoading = ref(false);
  const error = ref(null);

  // File operations
  async function openFile() {
    try {
      isLoading.value = true;
      error.value = null;
      return await bridge.openFile();
    } catch (err) {
      error.value = err.message || 'Failed to open file';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function saveFile(content) {
    try {
      isLoading.value = true;
      error.value = null;
      return await bridge.saveFile(content);
    } catch (err) {
      error.value = err.message || 'Failed to save file';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function saveFileAs(content) {
    try {
      isLoading.value = true;
      error.value = null;
      return await bridge.saveFileAs(content);
    } catch (err) {
      error.value = err.message || 'Failed to save file as';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // Project operations
  async function getProjects() {
    try {
      isLoading.value = true;
      error.value = null;
      return await bridge.getProjects();
    } catch (err) {
      error.value = err.message || 'Failed to get projects';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function getProject(id) {
    try {
      isLoading.value = true;
      error.value = null;
      return await bridge.getProject(id);
    } catch (err) {
      error.value = err.message || 'Failed to get project';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function saveProject(project) {
    try {
      isLoading.value = true;
      error.value = null;
      return await bridge.saveProject(project);
    } catch (err) {
      error.value = err.message || 'Failed to save project';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteProject(id) {
    try {
      isLoading.value = true;
      error.value = null;
      return await bridge.deleteProject(id);
    } catch (err) {
      error.value = err.message || 'Failed to delete project';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // AI operations
  async function initializeAI(settings) {
    try {
      isLoading.value = true;
      error.value = null;
      return await bridge.initializeAI(settings);
    } catch (err) {
      error.value = err.message || 'Failed to initialize AI';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function generateCompletion(prompt, options) {
    try {
      isLoading.value = true;
      error.value = null;
      return await bridge.generateCompletion(prompt, options);
    } catch (err) {
      error.value = err.message || 'Failed to generate completion';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function generateCompletionStream(prompt, options) {
    try {
      isLoading.value = true;
      error.value = null;
      return await bridge.generateCompletionStream(prompt, options);
    } catch (err) {
      error.value = err.message || 'Failed to generate completion stream';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  function onAIStream(callback) {
    return bridge.onAIStream(callback);
  }

  function onAIStreamComplete(callback) {
    return bridge.onAIStreamComplete(callback);
  }

  function onAIStreamError(callback) {
    return bridge.onAIStreamError(callback);
  }

  async function cancelCompletionStream(streamId) {
    try {
      isLoading.value = true;
      error.value = null;
      return await bridge.cancelCompletionStream(streamId);
    } catch (err) {
      error.value = err.message || 'Failed to cancel completion stream';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // System operations
  async function getSystemInfo() {
    try {
      isLoading.value = true;
      error.value = null;
      return await bridge.getSystemInfo();
    } catch (err) {
      error.value = err.message || 'Failed to get system info';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function getAppVersion() {
    try {
      isLoading.value = true;
      error.value = null;
      return await bridge.getAppVersion();
    } catch (err) {
      error.value = err.message || 'Failed to get app version';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    // State
    isLoading,
    error,
    
    // File operations
    openFile,
    saveFile,
    saveFileAs,
    
    // Project operations
    getProjects,
    getProject,
    saveProject,
    deleteProject,
    
    // AI operations
    initializeAI,
    generateCompletion,
    generateCompletionStream,
    cancelCompletionStream,
    onAIStream,
    onAIStreamComplete,
    onAIStreamError,
    
    // System operations
    getSystemInfo,
    getAppVersion,
  };
}