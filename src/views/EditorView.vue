<template>
  <div class="h-screen flex flex-col">
    <!-- Header -->
    <Header @toggle-sidebar="toggleSidebar" />
    
    <!-- Main content with sidebar -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar -->
      <Sidebar :is-open="sidebarOpen" @close="closeSidebar" />
      
      <!-- Main content area -->
      <MainContent :is-full-width="!sidebarOpen" class="flex flex-col" no-padding>
        <div class="flex flex-1 overflow-hidden" :class="layoutClasses">
          <!-- Editor panel -->
          <div 
            class="editor-panel transition-all overflow-hidden"
            :class="{ 
              'w-full': editorLayout === 'editor-focus',
              'w-0': editorLayout === 'chat-focus',
              'w-1/2': editorLayout === 'split'
            }"
          >
            <div class="h-full flex flex-col">
              <!-- Editor toolbar -->
              <div class="p-2 border-b bg-card flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <button 
                    class="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    @click="toggleFileExplorer"
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
                      class="mr-1"
                    >
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    Files
                  </button>
                  <span 
                    v-if="currentFile" 
                    class="text-sm font-medium truncate max-w-[200px]"
                  >
                    {{ currentFile }}
                  </span>
                </div>
                
                <div class="flex items-center space-x-2">
                  <button 
                    class="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90"
                    @click="saveFile"
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
                      class="mr-1"
                    >
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    Save
                  </button>
                  
                  <!-- Layout toggle buttons -->
                  <div class="flex rounded-md overflow-hidden border">
                    <button
                      class="inline-flex items-center justify-center h-8 w-8"
                      :class="editorLayout === 'editor-focus' ? 'bg-accent text-accent-foreground' : 'bg-transparent hover:bg-muted'"
                      @click="setLayout('editor-focus')"
                      title="Editor focus"
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
                        <rect width="18" height="18" x="3" y="3" rx="2" />
                        <path d="M9 3v18" />
                      </svg>
                    </button>
                    <button
                      class="inline-flex items-center justify-center h-8 w-8"
                      :class="editorLayout === 'split' ? 'bg-accent text-accent-foreground' : 'bg-transparent hover:bg-muted'"
                      @click="setLayout('split')"
                      title="Split view"
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
                        <rect width="18" height="18" x="3" y="3" rx="2" />
                        <path d="M12 3v18" />
                      </svg>
                    </button>
                    <button
                      class="inline-flex items-center justify-center h-8 w-8"
                      :class="editorLayout === 'chat-focus' ? 'bg-accent text-accent-foreground' : 'bg-transparent hover:bg-muted'"
                      @click="setLayout('chat-focus')"
                      title="Chat focus"
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
                        <rect width="18" height="18" x="3" y="3" rx="2" />
                        <path d="M15 3v18" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Code editor container -->
              <div ref="editorContainer" class="flex-1 h-full overflow-hidden"></div>
            </div>
          </div>
          
          <!-- Chat panel -->
          <div 
            class="chat-panel transition-all overflow-hidden"
            :class="{ 
              'w-full': editorLayout === 'chat-focus',
              'w-0': editorLayout === 'editor-focus',
              'w-1/2': editorLayout === 'split'
            }"
          >
            <ChatPanel 
              v-if="editorLayout !== 'editor-focus'"
              :messages="chatMessages"
              :ai-provider="aiProvider"
              :is-loading="isLoading"
              :loading-message="loadingMessage"
              :token-counts="tokenCounts"
              :response-time="responseTime"
              :auto-apply="autoApplyCode"
              @submit="handleChatSubmit"
              @cancel="handleChatCancel"
              @clear="handleChatClear"
              @apply-code="handleApplyCode"
              @modify-code="handleModifyCode"
              @reject-code="handleRejectCode"
              @code-settings="handleCodeSettings"
              @settings="handleChatSettings"
              @update:auto-apply="updateAutoApply"
              @attach="handleAttachment"
            />
          </div>
        </div>
      </MainContent>
    </div>
    
    <!-- Status bar -->
    <StatusBar 
      :status="editorStatus"
      :current-file="currentFile"
      :project-name="currentProject?.name"
      :ai-model="aiProvider.model"
      :language="currentLanguage"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import * as monaco from 'monaco-editor';
import { useChat } from '../composables/useChat';
import { useNotifications } from '../composables/useNotifications';
import { useUIStore } from '../stores/uiStore';
import { useProjectStore } from '../stores/projectStore';
import { useChatStore } from '../stores/chatStore';
import { useAIStore } from '../stores/aiStore';

// Import components
import Header from '../components/layout/Header.vue';
import Sidebar from '../components/layout/Sidebar.vue';
import MainContent from '../components/layout/MainContent.vue';
import StatusBar from '../components/layout/StatusBar.vue';
import ChatPanel from '../components/chat/ChatPanel.vue';

// Route and router
const route = useRoute();
const router = useRouter();

// Stores
const uiStore = useUIStore();
const projectStore = useProjectStore();
const chatStore = useChatStore();
const aiStore = useAIStore();

// Composables
const { notify } = useNotifications();
const {
  isStreaming,
  loadingMessage,
  activeProvider,
  activeModel,
  activeMessages,
  autoApplyCode,
  tokenCounts,
  responseTime,
  sendMessage,
  cancelRequest,
  clearChat,
  applyCode,
  handleAttachment
} = useChat();

// Refs
const editorContainer = ref(null);
const editor = ref(null);
const currentFile = ref('untitled.js');
const currentLanguage = ref('javascript');
const editorStatus = ref('online');
const fileExplorerOpen = ref(false);

// UI state
const sidebarOpen = ref(uiStore.sidebarOpen);
const editorLayout = ref(uiStore.editorLayout);

// Computed properties
const currentProject = computed(() => projectStore.currentProject);
const chatMessages = computed(() => chatStore.activeMessages);
const aiProvider = computed(() => ({
  name: activeProvider.value.name,
  model: activeModel.value.name
}));
const isLoading = computed(() => chatStore.isStreaming);

// Layout classes for editor/chat split
const layoutClasses = computed(() => {
  switch (editorLayout.value) {
    case 'editor-focus':
      return 'editor-focused';
    case 'chat-focus':
      return 'chat-focused';
    default:
      return 'split-view';
  }
});

// Watch for layout changes
watch(() => uiStore.editorLayout, (newLayout) => {
  editorLayout.value = newLayout;
  
  // Give the DOM time to update layout before refreshing editor
  setTimeout(() => {
    if (editor.value) {
      editor.value.layout();
    }
  }, 300);
});

// Watch for sidebar changes
watch(() => uiStore.sidebarOpen, (newValue) => {
  sidebarOpen.value = newValue;
  
  // Give the DOM time to update layout before refreshing editor
  setTimeout(() => {
    if (editor.value) {
      editor.value.layout();
    }
  }, 300);
});

// Initialize Monaco editor
const initEditor = () => {
  if (editorContainer.value) {
    editor.value = monaco.editor.create(editorContainer.value, {
      value: '// Welcome to Mimir Code Editor\n\nfunction helloWorld() {\n  console.log("Hello, world!");\n}\n',
      language: 'javascript',
      theme: uiStore.isDarkMode ? 'vs-dark' : 'vs',
      automaticLayout: true,
      minimap: {
        enabled: uiStore.editorSettings.minimap
      },
      fontSize: uiStore.editorSettings.fontSize,
      tabSize: uiStore.editorSettings.tabSize,
      wordWrap: uiStore.editorSettings.wordWrap,
      lineNumbers: uiStore.editorSettings.lineNumbers
    });
    
    // Set up event listeners
    editor.value.onDidChangeModelContent(() => {
      // Auto-save if enabled
      if (uiStore.editorSettings.autoSave) {
        // Debounced save
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
          saveFile();
        }, 1000);
      }
    });
  }
};

// For debounced auto-save
let autoSaveTimeout;

// Toggle sidebar
const toggleSidebar = () => {
  uiStore.toggleSidebar();
};

// Close sidebar (mobile)
const closeSidebar = () => {
  uiStore.setSidebarOpen(false);
};

// Set layout
const setLayout = (layout) => {
  uiStore.setEditorLayout(layout);
};

// Toggle file explorer
const toggleFileExplorer = () => {
  fileExplorerOpen.value = !fileExplorerOpen.value;
  // This would typically trigger a file explorer panel
};

// Save current file
const saveFile = async () => {
  if (!editor.value) return;
  
  try {
    // Get content from editor
    const content = editor.value.getValue();
    
    // This would typically use the Electron IPC to save the file
    const result = await window.electronAPI.saveFile({
      path: currentFile.value,
      content,
      projectId: currentProject.value?.id
    });
    
    if (result.success) {
      notify({
        type: 'success',
        title: 'File Saved',
        message: `${currentFile.value} saved successfully`
      });
    } else {
      throw new Error(result.error || 'Failed to save file');
    }
  } catch (error) {
    notify({
      type: 'error',
      title: 'Save Failed',
      message: error.message || 'Failed to save file'
    });
  }
};

// Handle chat submission
const handleChatSubmit = async (data) => {
  try {
    await sendMessage(data.text, data.attachments);
  } catch (error) {
    notify({
      type: 'error',
      title: 'Chat Error',
      message: error.message || 'Failed to send message'
    });
  }
};

// Handle chat cancellation
const handleChatCancel = async () => {
  try {
    await cancelRequest();
  } catch (error) {
    notify({
      type: 'error',
      title: 'Cancellation Error',
      message: error.message || 'Failed to cancel request'
    });
  }
};

// Handle chat clear
const handleChatClear = () => {
  clearChat();
};

// Handle code application
const handleApplyCode = async (message) => {
  try {
    // Get the code content from the message
    const code = message.content;
    
    // Apply to editor
    if (editor.value && code) {
      editor.value.setValue(code);
      
      notify({
        type: 'success',
        title: 'Code Applied',
        message: 'AI-generated code has been applied to the editor'
      });
    }
  } catch (error) {
    notify({
      type: 'error',
      title: 'Code Application Failed',
      message: error.message || 'Failed to apply code'
    });
  }
};

// Handle code modification request
const handleModifyCode = (message) => {
  // Prepare a message asking for modifications
  const editorContent = editor.value ? editor.value.getValue() : '';
  
  // Formulate a prompt for the AI to modify the code
  handleChatSubmit({
    text: `Please modify your code based on the current editor content:\n\n\`\`\`\n${editorContent}\n\`\`\`\n\nI'd like you to improve it by:`
  });
};

// Handle code rejection
const handleRejectCode = (message) => {
  // Notify AI that code was rejected
  handleChatSubmit({
    text: "I'm going to reject this code suggestion. Please provide a different approach that:"
  });
};

// Handle code settings
const handleCodeSettings = () => {
  router.push('/settings?tab=ai');
};

// Handle chat settings
const handleChatSettings = () => {
  router.push('/settings?tab=chat');
};

// Update auto-apply setting
const updateAutoApply = (value) => {
  chatStore.setAutoApplyCode(value);
};

// Initialize the view
onMounted(() => {
  // Initialize editor
  initEditor();
  
  // Load project if ID is provided
  const projectId = route.query.project;
  if (projectId) {
    projectStore.fetchProjects().then(() => {
      const project = projectStore.getProjectById(projectId);
      if (project) {
        projectStore.setCurrentProject(project);
        
        // Load project files (in a real app)
        // loadProjectFiles(project);
        
        // Create or load chat for this project
        // chatStore.createConversation(projectId, `Chat for ${project.name}`);
      }
    });
  }
  
  // Handle theme changes
  watch(() => uiStore.isDarkMode, (isDark) => {
    if (editor.value) {
      monaco.editor.setTheme(isDark ? 'vs-dark' : 'vs');
    }
  });
});

// Clean up resources
onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.dispose();
  }
  
  clearTimeout(autoSaveTimeout);
});
</script>

<style scoped>
.editor-panel,
.chat-panel {
  min-width: 0;
}
</style>