<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <Header @toggle-sidebar="toggleSidebar" />
    
    <!-- Main content with sidebar -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar -->
      <Sidebar :is-open="sidebarOpen" @close="closeSidebar" />
      
      <!-- Main content area -->
      <MainContent :is-full-width="!sidebarOpen" class="p-6">
        <h1 class="text-2xl font-bold mb-6">Settings</h1>
        
        <div v-if="isLoading" class="flex items-center justify-center py-12">
          <svg
            class="animate-spin h-8 w-8 text-muted-foreground"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p class="ml-4 text-muted-foreground">Loading settings...</p>
        </div>
        
        <div v-else class="max-w-2xl bg-card rounded-lg shadow-md p-6">
          <!-- Theme settings -->
          <div class="mb-8">
            <h2 class="text-xl font-semibold mb-4">Appearance</h2>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span>Theme</span>
                <div class="flex space-x-2">
                  <button
                    @click="setTheme('light')"
                    class="px-4 py-2 rounded-md"
                    :class="currentTheme === 'light' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'"
                  >
                    Light
                  </button>
                  <button
                    @click="setTheme('dark')"
                    class="px-4 py-2 rounded-md"
                    :class="currentTheme === 'dark' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'"
                  >
                    Dark
                  </button>
                  <button
                    @click="setTheme('system')"
                    class="px-4 py-2 rounded-md"
                    :class="currentTheme === 'system' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'"
                  >
                    System
                  </button>
                </div>
              </div>
              
              <div class="flex items-center justify-between">
                <span>Animations</span>
                <input
                  v-model="settings.ui.enableAnimations"
                  type="checkbox"
                  class="h-5 w-5"
                />
              </div>
            </div>
          </div>
          
          <!-- AI model settings -->
          <div class="mb-8">
            <h2 class="text-xl font-semibold mb-4">AI Models</h2>
            <div class="space-y-4">
              <div>
                <label class="block mb-2">Default Completion Model</label>
                <Select
                  v-model="settings.ai.defaultCompletionModel"
                  :options="availableModels"
                  :disabled="isProcessing"
                />
              </div>
              
              <div>
                <label class="block mb-2">Default Code Model</label>
                <Select
                  v-model="settings.ai.defaultCodeModel"
                  :options="availableModels"
                  :disabled="isProcessing"
                />
              </div>
              
              <div>
                <label class="block mb-2">Temperature</label>
                <div class="flex items-center">
                  <input
                    v-model="settings.ai.temperature"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    class="w-full mr-2"
                    :disabled="isProcessing"
                  />
                  <span class="w-10 text-center">{{ settings.ai.temperature }}</span>
                </div>
              </div>
              
              <div>
                <label class="block mb-2">API Provider</label>
                <Select
                  v-model="settings.ai.provider"
                  :options="availableProviders"
                  :disabled="isProcessing"
                />
              </div>
              
              <div v-if="settings.ai.provider !== 'local'">
                <label class="block mb-2">API Key</label>
                <Input
                  v-model="settings.ai.apiKey"
                  type="password"
                  placeholder="Enter your API key"
                  :disabled="isProcessing"
                />
                <p class="text-xs text-muted-foreground mt-1">
                  Your API key is stored securely on your device.
                </p>
              </div>
              
              <div class="pt-2">
                <button
                  @click="testAIConnection"
                  class="px-4 py-2 text-sm border border-input bg-background rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                  :disabled="isTestingConnection || isProcessing"
                >
                  {{ isTestingConnection ? 'Testing...' : 'Test Connection' }}
                </button>
              </div>
            </div>
          </div>
          
          <!-- Editor settings -->
          <div class="mb-8">
            <h2 class="text-xl font-semibold mb-4">Editor</h2>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span>Font Size</span>
                <Input
                  v-model.number="settings.editor.fontSize"
                  type="number"
                  min="10"
                  max="24"
                  class="w-20"
                  :disabled="isProcessing"
                />
              </div>
              
              <div class="flex items-center justify-between">
                <span>Tab Size</span>
                <Input
                  v-model.number="settings.editor.tabSize"
                  type="number"
                  min="2"
                  max="8"
                  class="w-20"
                  :disabled="isProcessing"
                />
              </div>
              
              <div class="flex items-center justify-between">
                <span>Word Wrap</span>
                <input
                  v-model="settings.editor.wordWrap"
                  type="checkbox"
                  class="h-5 w-5"
                  :disabled="isProcessing"
                />
              </div>
              
              <div class="flex items-center justify-between">
                <span>Auto Save</span>
                <input
                  v-model="settings.editor.autoSave"
                  type="checkbox"
                  class="h-5 w-5"
                  :disabled="isProcessing"
                />
              </div>
              
              <div class="flex items-center justify-between">
                <span>Line Numbers</span>
                <input
                  v-model="settings.editor.lineNumbers"
                  type="checkbox"
                  class="h-5 w-5"
                  :disabled="isProcessing"
                />
              </div>
            </div>
          </div>
          
          <!-- Keyboard shortcuts -->
          <div class="mb-8">
            <h2 class="text-xl font-semibold mb-4">Keyboard Shortcuts</h2>
            <div class="space-y-2">
              <div v-for="(shortcut, key) in settings.shortcuts" :key="key" class="flex items-center justify-between py-2 border-b border-border">
                <span>{{ shortcutLabels[key] }}</span>
                <div class="flex items-center">
                  <input
                    v-model="settings.shortcuts[key]"
                    class="w-32 p-2 border rounded-md bg-background text-center"
                    :disabled="isProcessing"
                    @focus="activeShortcut = key"
                    @blur="activeShortcut = null"
                    @keydown.stop.prevent="captureShortcut($event, key)"
                    readonly
                  />
                  <button
                    @click="resetShortcut(key)"
                    class="ml-2 text-muted-foreground hover:text-foreground"
                    :disabled="isProcessing"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Privacy settings -->
          <div class="mb-8">
            <h2 class="text-xl font-semibold mb-4">Privacy</h2>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <span class="block">Anonymous Usage Data</span>
                  <span class="text-xs text-muted-foreground">Help improve Mimir by sending anonymous usage data</span>
                </div>
                <input
                  v-model="settings.privacy.collectAnonymousUsage"
                  type="checkbox"
                  class="h-5 w-5"
                  :disabled="isProcessing"
                />
              </div>
              
              <div class="flex items-center justify-between">
                <div>
                  <span class="block">Crash Reports</span>
                  <span class="text-xs text-muted-foreground">Send crash reports to help improve stability</span>
                </div>
                <input
                  v-model="settings.privacy.sendCrashReports"
                  type="checkbox"
                  class="h-5 w-5"
                  :disabled="isProcessing"
                />
              </div>
            </div>
          </div>
          
          <!-- Action buttons -->
          <div class="flex justify-between">
            <button
              @click="resetToDefaults"
              class="px-4 py-2 border border-input bg-background text-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              :disabled="isProcessing"
            >
              Reset to Defaults
            </button>
            <button
              @click="saveSettings"
              class="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
              :disabled="isProcessing"
            >
              {{ isProcessing ? 'Saving...' : 'Save Settings' }}
            </button>
          </div>
        </div>
      </MainContent>
    </div>
    
    <!-- Status bar -->
    <StatusBar />
    
    <!-- Reset confirmation dialog -->
    <Dialog v-model="showResetConfirmation" title="Reset Settings">
      <p class="mb-4">
        Are you sure you want to reset all settings to their default values?
        This action cannot be undone.
      </p>
      
      <div class="mt-6 flex justify-end space-x-4">
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
          @click="showResetConfirmation = false"
        >
          Cancel
        </button>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
          :disabled="isProcessing"
          @click="confirmResetToDefaults"
        >
          {{ isProcessing ? 'Resetting...' : 'Reset Settings' }}
        </button>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { useSettingsStore } from '../stores/settingsStore';
import { useUIStore } from '../stores/uiStore';
import { useTheme } from '../composables/useTheme';
import { useNotifications } from '../composables/useNotifications';
import { useAI } from '../composables/useAI';
import { useKeyboardShortcuts } from '../composables/useKeyboardShortcuts';

// Import components
import Header from '../components/layout/Header.vue';
import Sidebar from '../components/layout/Sidebar.vue';
import MainContent from '../components/layout/MainContent.vue';
import StatusBar from '../components/layout/StatusBar.vue';
import Dialog from '../components/ui/Dialog.vue';
import Input from '../components/ui/Input.vue';
import Select from '../components/ui/Select.vue';

// Stores and composables
const settingsStore = useSettingsStore();
const uiStore = useUIStore();
const { theme: currentTheme, setTheme } = useTheme();
const { notify } = useNotifications();
const { providers: aiProviders, testConnection } = useAI();
const { defaultShortcuts } = useKeyboardShortcuts();

// Reactive state
const sidebarOpen = ref(uiStore.sidebarOpen);
const isLoading = ref(true);
const isProcessing = ref(false);
const isTestingConnection = ref(false);
const showResetConfirmation = ref(false);
const activeShortcut = ref(null);
const settings = reactive({
  ui: {
    theme: currentTheme.value,
    enableAnimations: true
  },
  ai: {
    defaultCompletionModel: 'gpt-4',
    defaultCodeModel: 'claude-3',
    temperature: 0.7,
    provider: 'openai',
    apiKey: ''
  },
  editor: {
    fontSize: 14,
    tabSize: 2,
    wordWrap: true,
    autoSave: true,
    lineNumbers: true
  },
  privacy: {
    collectAnonymousUsage: true,
    sendCrashReports: true
  },
  shortcuts: {
    newProject: 'Ctrl+N',
    openProject: 'Ctrl+O',
    saveProject: 'Ctrl+S',
    runCode: 'Ctrl+R',
    toggleSidebar: 'Ctrl+B',
    focusEditor: 'Ctrl+E',
    focusChat: 'Ctrl+T',
    newChat: 'Ctrl+Shift+N',
    clearChat: 'Ctrl+L'
  }
});

// Computed properties
const availableModels = computed(() => {
  return [
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'claude-3-opus', label: 'Claude 3 Opus' },
    { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
    { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
    { value: 'llama-3-70b', label: 'Llama 3 (70B)' },
    { value: 'llama-3-8b', label: 'Llama 3 (8B)' },
    { value: 'code-llama', label: 'Code Llama' }
  ];
});

const availableProviders = computed(() => {
  return [
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'local', label: 'Local (Ollama)' },
    { value: 'lmstudio', label: 'LM Studio' },
    { value: 'googleai', label: 'Google AI' }
  ];
});

const shortcutLabels = {
  newProject: 'New Project',
  openProject: 'Open Project',
  saveProject: 'Save Project',
  runCode: 'Run Code',
  toggleSidebar: 'Toggle Sidebar',
  focusEditor: 'Focus Editor',
  focusChat: 'Focus Chat',
  newChat: 'New Chat',
  clearChat: 'Clear Chat'
};

// Toggle sidebar
const toggleSidebar = () => {
  uiStore.toggleSidebar();
};

// Close sidebar (mobile)
const closeSidebar = () => {
  uiStore.setSidebarOpen(false);
};

// Load settings
async function loadSettings() {
  isLoading.value = true;
  
  try {
    // Get settings from store
    const storedSettings = await settingsStore.getSettings();
    
    // Update local settings
    if (storedSettings) {
      Object.keys(settings).forEach(key => {
        if (storedSettings[key]) {
          if (typeof settings[key] === 'object' && !Array.isArray(settings[key])) {
            Object.assign(settings[key], storedSettings[key]);
          } else {
            settings[key] = storedSettings[key];
          }
        }
      });
    }
    
    // Apply theme
    if (settings.ui.theme) {
      setTheme(settings.ui.theme);
    }
  } catch (error) {
    notify({
      type: 'error',
      title: 'Failed to Load Settings',
      message: error.message || 'Could not load settings'
    });
    console.error('Failed to load settings:', error);
  } finally {
    isLoading.value = false;
  }
}

// Save settings
async function saveSettings() {
  if (isProcessing.value) return;
  isProcessing.value = true;
  
  try {
    // Update theme in local storage
    setTheme(settings.ui.theme);
    
    // Save settings using IPC
    await settingsStore.saveSettings(settings);
    
    // Show success notification
    notify({
      type: 'success',
      title: 'Settings Saved',
      message: 'Your settings have been saved successfully'
    });
  } catch (error) {
    notify({
      type: 'error',
      title: 'Failed to Save Settings',
      message: error.message || 'Could not save settings'
    });
    console.error('Failed to save settings:', error);
  } finally {
    isProcessing.value = false;
  }
}

// Test AI connection
async function testAIConnection() {
  isTestingConnection.value = true;
  
  try {
    const result = await testConnection(settings.ai.provider, settings.ai.apiKey);
    
    if (result.success) {
      notify({
        type: 'success',
        title: 'Connection Successful',
        message: `Successfully connected to ${settings.ai.provider}`
      });
    } else {
      throw new Error(result.error || 'Connection test failed');
    }
  } catch (error) {
    notify({
      type: 'error',
      title: 'Connection Failed',
      message: error.message || 'Could not connect to the AI provider'
    });
  } finally {
    isTestingConnection.value = false;
  }
}

// Reset to defaults
function resetToDefaults() {
  showResetConfirmation.value = true;
}

// Confirm reset to defaults
async function confirmResetToDefaults() {
  isProcessing.value = true;
  
  try {
    // Reset theme
    setTheme('system');
    
    // Reset settings to defaults
    settings.ui = {
      theme: 'system',
      enableAnimations: true
    };
    settings.ai = {
      defaultCompletionModel: 'gpt-4',
      defaultCodeModel: 'claude-3-opus',
      temperature: 0.7,
      provider: 'openai',
      apiKey: ''
    };
    settings.editor = {
      fontSize: 14,
      tabSize: 2,
      wordWrap: true,
      autoSave: true,
      lineNumbers: true
    };
    settings.privacy = {
      collectAnonymousUsage: true,
      sendCrashReports: true
    };
    
    // Reset shortcuts to defaults
    Object.keys(defaultShortcuts).forEach(key => {
      settings.shortcuts[key] = defaultShortcuts[key];
    });
    
    // Save settings
    await settingsStore.saveSettings(settings);
    
    // Close dialog
    showResetConfirmation.value = false;
    
    // Show success notification
    notify({
      type: 'success',
      title: 'Settings Reset',
      message: 'All settings have been reset to their default values'
    });
  } catch (error) {
    notify({
      type: 'error',
      title: 'Reset Failed',
      message: error.message || 'Could not reset settings'
    });
  } finally {
    isProcessing.value = false;
  }
}

// Capture keyboard shortcut
function captureShortcut(event, key) {
  if (!activeShortcut.value) return;
  
  const modifiers = [];
  if (event.ctrlKey) modifiers.push('Ctrl');
  if (event.altKey) modifiers.push('Alt');
  if (event.shiftKey) modifiers.push('Shift');
  if (event.metaKey) modifiers.push('Meta');
  
  // Get the key (excluding modifier keys)
  let keyName = event.key;
  if (keyName === 'Control' || keyName === 'Alt' || keyName === 'Shift' || keyName === 'Meta') {
    return;
  }
  
  // Format key name
  if (keyName === ' ') keyName = 'Space';
  if (keyName.length === 1) keyName = keyName.toUpperCase();
  
  // Format the shortcut
  const shortcut = [...modifiers, keyName].join('+');
  
  // Update the shortcut
  settings.shortcuts[key] = shortcut;
}

// Reset shortcut to default
function resetShortcut(key) {
  if (defaultShortcuts[key]) {
    settings.shortcuts[key] = defaultShortcuts[key];
  }
}

// Initialize
onMounted(async () => {
  await loadSettings();
});
</script>