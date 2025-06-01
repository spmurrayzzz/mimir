import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as monaco from 'monaco-editor';
import { useSettingsStore } from '../stores/settingsStore';

/**
 * Composable for using Monaco Editor
 * @param {Object} options - Editor options
 * @returns {Object} - Editor utilities and refs
 */
export function useMonacoEditor(options = {}) {
  const editorContainer = ref(null);
  const editor = ref(null);
  const isReady = ref(false);
  const settingsStore = useSettingsStore();
  
  // Create editor instance
  const createEditor = () => {
    if (!editorContainer.value) return;
    
    // Apply settings from store
    const editorSettings = settingsStore.editor;
    
    // Create editor with merged options
    editor.value = monaco.editor.create(editorContainer.value, {
      automaticLayout: true,
      minimap: {
        enabled: editorSettings.minimap,
      },
      lineNumbers: editorSettings.lineNumbers ? 'on' : 'off',
      fontSize: editorSettings.fontSize,
      tabSize: editorSettings.tabSize,
      wordWrap: editorSettings.wordWrap ? 'on' : 'off',
      theme: settingsStore.theme === 'dark' ? 'vs-dark' : 'vs',
      ...options
    });
    
    isReady.value = true;
  };
  
  // Set editor content
  const setContent = (content, language = 'javascript') => {
    if (!editor.value) return;
    
    const model = monaco.editor.createModel(content, language);
    editor.value.setModel(model);
  };
  
  // Get editor content
  const getContent = () => {
    if (!editor.value) return '';
    return editor.value.getValue();
  };
  
  // Watch for theme changes
  watch(() => settingsStore.theme, (newTheme) => {
    if (editor.value) {
      monaco.editor.setTheme(newTheme === 'dark' ? 'vs-dark' : 'vs');
    }
  });
  
  // Update editor settings when they change
  watch(() => settingsStore.editor, (newSettings) => {
    if (editor.value) {
      editor.value.updateOptions({
        fontSize: newSettings.fontSize,
        tabSize: newSettings.tabSize,
        wordWrap: newSettings.wordWrap ? 'on' : 'off',
        minimap: {
          enabled: newSettings.minimap,
        },
        lineNumbers: newSettings.lineNumbers ? 'on' : 'off',
      });
    }
  }, { deep: true });
  
  // Initialize editor on mount
  onMounted(() => {
    createEditor();
  });
  
  // Cleanup on unmount
  onBeforeUnmount(() => {
    if (editor.value) {
      editor.value.dispose();
      editor.value = null;
    }
  });
  
  return {
    editorContainer,
    editor,
    isReady,
    setContent,
    getContent
  };
}