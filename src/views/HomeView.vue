<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <Header @toggle-sidebar="toggleSidebar" />
    
    <!-- Main content with sidebar -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar -->
      <Sidebar :is-open="sidebarOpen" @close="closeSidebar" />
      
      <!-- Main content area -->
      <MainContent :is-full-width="!sidebarOpen">
        <div class="max-w-5xl mx-auto px-4 py-8 md:py-12">
          <h1 class="text-3xl md:text-4xl font-bold mb-6">Welcome to Mimir</h1>
          <p class="text-lg text-muted-foreground mb-8">
            AI-powered code editing desktop application
          </p>
          
          <!-- Quick Actions -->
          <section class="mb-12">
            <h2 class="text-xl font-semibold mb-4">Quick Actions</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card class="hover:shadow-md transition-shadow">
                <template #header>
                  <div class="flex items-center space-x-2">
                    <div class="rounded-full p-2 bg-primary text-primary-foreground">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                        <path d="M12 18v-6" />
                        <path d="M9 15h6" />
                      </svg>
                    </div>
                    <h3 class="font-medium">New Project</h3>
                  </div>
                </template>
                <p class="text-sm text-muted-foreground">
                  Create a new coding project with AI assistance
                </p>
                <template #footer>
                  <button 
                    @click="createNewProject"
                    class="w-full inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Create Project
                  </button>
                </template>
              </Card>
              
              <Card class="hover:shadow-md transition-shadow">
                <template #header>
                  <div class="flex items-center space-x-2">
                    <div class="rounded-full p-2 bg-secondary text-secondary-foreground">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <h3 class="font-medium">Open Project</h3>
                  </div>
                </template>
                <p class="text-sm text-muted-foreground">
                  Continue working on an existing project
                </p>
                <template #footer>
                  <button 
                    @click="$router.push('/projects')" 
                    class="w-full inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  >
                    Browse Projects
                  </button>
                </template>
              </Card>
              
              <Card class="hover:shadow-md transition-shadow">
                <template #header>
                  <div class="flex items-center space-x-2">
                    <div class="rounded-full p-2 bg-accent text-accent-foreground">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path d="m18 16 4-4-4-4" />
                        <path d="m6 8-4 4 4 4" />
                        <path d="m14.5 4-5 16" />
                      </svg>
                    </div>
                    <h3 class="font-medium">Code Playground</h3>
                  </div>
                </template>
                <p class="text-sm text-muted-foreground">
                  Experiment with code in the AI-assisted sandbox
                </p>
                <template #footer>
                  <button 
                    @click="openPlayground"
                    class="w-full inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-accent text-accent-foreground hover:bg-accent/80"
                  >
                    Open Playground
                  </button>
                </template>
              </Card>
            </div>
          </section>
          
          <!-- Recent Projects -->
          <section class="mb-12" v-if="recentProjects.length > 0">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold">Recent Projects</h2>
              <button 
                @click="$router.push('/projects')"
                class="text-sm text-primary hover:underline"
              >
                View all
              </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card 
                v-for="project in recentProjects" 
                :key="project.id"
                class="hover:shadow-md transition-shadow"
              >
                <template #header>
                  <div class="flex items-center justify-between">
                    <h3 class="font-medium truncate">{{ project.name }}</h3>
                    <span class="text-xs text-muted-foreground">
                      {{ formatDate(project.updatedAt) }}
                    </span>
                  </div>
                </template>
                
                <p class="text-sm text-muted-foreground truncate mb-2">
                  {{ project.description || 'No description' }}
                </p>
                
                <div class="flex items-center text-xs text-muted-foreground">
                  <div class="flex items-center mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
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
                    {{ project.fileCount || 0 }} files
                  </div>
                  
                  <div class="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="mr-1"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    {{ project.chatCount || 0 }} chats
                  </div>
                </div>
                
                <template #footer>
                  <button 
                    @click="openProject(project)"
                    class="w-full inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  >
                    Open Project
                  </button>
                </template>
              </Card>
            </div>
          </section>
          
          <!-- Features -->
          <section>
            <h2 class="text-xl font-semibold mb-4">Features</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex">
                <div class="mr-4 rounded-full p-2 bg-primary/10 text-primary h-fit">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="m12 8-9.04 9.06a2.82 2.82 0 1 0 3.98 3.98L16 12"/>
                    <circle cx="17" cy="7" r="5"/>
                  </svg>
                </div>
                <div>
                  <h3 class="font-medium mb-1">AI Code Generation</h3>
                  <p class="text-sm text-muted-foreground">
                    Generate code snippets, complete functions, and refactor existing code using state-of-the-art AI models.
                  </p>
                </div>
              </div>
              
              <div class="flex">
                <div class="mr-4 rounded-full p-2 bg-primary/10 text-primary h-fit">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <path d="M8 21h8" />
                    <path d="M12 17v4" />
                    <path d="m17 8-2 2-2-2" />
                    <path d="M9 10 7 8l-2 2" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-medium mb-1">Modern Editor</h3>
                  <p class="text-sm text-muted-foreground">
                    Full-featured code editor with syntax highlighting, code completion, and intelligent suggestions.
                  </p>
                </div>
              </div>
              
              <div class="flex">
                <div class="mr-4 rounded-full p-2 bg-primary/10 text-primary h-fit">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    <path d="M13 8h.01" />
                    <path d="M17 8h.01" />
                    <path d="M9 8h.01" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-medium mb-1">Contextual Chat</h3>
                  <p class="text-sm text-muted-foreground">
                    Chat with AI about your code with full context awareness and project understanding.
                  </p>
                </div>
              </div>
              
              <div class="flex">
                <div class="mr-4 rounded-full p-2 bg-primary/10 text-primary h-fit">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-medium mb-1">Multiple AI Providers</h3>
                  <p class="text-sm text-muted-foreground">
                    Choose from OpenAI, Anthropic, Google AI, or run local models through Ollama and LM Studio.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </MainContent>
    </div>
    
    <!-- Status bar -->
    <StatusBar />
  </div>
  
  <!-- New Project Dialog -->
  <Dialog v-model="newProjectDialogOpen" title="Create New Project">
    <form @submit.prevent="submitNewProject">
      <div class="space-y-4">
        <div>
          <label for="project-name" class="block text-sm font-medium mb-1">Project Name</label>
          <Input
            id="project-name"
            v-model="newProject.name"
            placeholder="My Awesome Project"
            :error="validationErrors.name"
            required
          />
        </div>
        
        <div>
          <label for="project-description" class="block text-sm font-medium mb-1">Description (optional)</label>
          <textarea
            id="project-description"
            v-model="newProject.description"
            rows="3"
            class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Brief description of your project"
          ></textarea>
        </div>
        
        <div>
          <label for="project-template" class="block text-sm font-medium mb-1">Project Template</label>
          <Select
            id="project-template"
            v-model="newProject.template"
            :error="validationErrors.template"
          >
            <option value="empty">Empty Project</option>
            <option value="web">Web Application (HTML/CSS/JS)</option>
            <option value="react">React Application</option>
            <option value="vue">Vue Application</option>
            <option value="node">Node.js Application</option>
            <option value="python">Python Application</option>
          </Select>
        </div>
      </div>
      
      <div class="mt-6 flex justify-end space-x-4">
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
          @click="newProjectDialogOpen = false"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
          :disabled="isCreatingProject"
        >
          {{ isCreatingProject ? 'Creating...' : 'Create Project' }}
        </button>
      </div>
    </form>
  </Dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '../stores/projectStore';
import { useUIStore } from '../stores/uiStore';
import { useNotifications } from '../composables/useNotifications';

// Import components
import Header from '../components/layout/Header.vue';
import Sidebar from '../components/layout/Sidebar.vue';
import MainContent from '../components/layout/MainContent.vue';
import StatusBar from '../components/layout/StatusBar.vue';
import Card from '../components/ui/Card.vue';
import Dialog from '../components/ui/Dialog.vue';
import Input from '../components/ui/Input.vue';
import Select from '../components/ui/Select.vue';

// Router
const router = useRouter();

// Stores
const projectStore = useProjectStore();
const uiStore = useUIStore();
const { notify } = useNotifications();

// Reactive state
const sidebarOpen = ref(uiStore.sidebarOpen);
const newProjectDialogOpen = ref(false);
const isCreatingProject = ref(false);
const newProject = ref({
  name: '',
  description: '',
  template: 'empty'
});
const validationErrors = ref({
  name: '',
  template: ''
});

// Computed properties
const recentProjects = computed(() => {
  return projectStore.sortedProjects.slice(0, 6);
});

// Toggle sidebar
const toggleSidebar = () => {
  uiStore.toggleSidebar();
  sidebarOpen.value = uiStore.sidebarOpen;
};

// Close sidebar (mobile)
const closeSidebar = () => {
  uiStore.setSidebarOpen(false);
  sidebarOpen.value = false;
};

// Create new project
const createNewProject = () => {
  // Reset form
  newProject.value = {
    name: '',
    description: '',
    template: 'empty'
  };
  validationErrors.value = {
    name: '',
    template: ''
  };
  
  // Open dialog
  newProjectDialogOpen.value = true;
};

// Submit new project
const submitNewProject = async () => {
  // Validate form
  let isValid = true;
  
  if (!newProject.value.name.trim()) {
    validationErrors.value.name = 'Project name is required';
    isValid = false;
  } else {
    validationErrors.value.name = '';
  }
  
  if (!newProject.value.template) {
    validationErrors.value.template = 'Please select a template';
    isValid = false;
  } else {
    validationErrors.value.template = '';
  }
  
  if (!isValid) return;
  
  try {
    isCreatingProject.value = true;
    
    // Create project
    const project = await projectStore.saveProject({
      name: newProject.value.name,
      description: newProject.value.description,
      template: newProject.value.template,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Set as current project
    projectStore.setCurrentProject(project);
    
    // Close dialog
    newProjectDialogOpen.value = false;
    
    // Notify success
    notify({
      type: 'success',
      title: 'Project Created',
      message: `Project "${project.name}" created successfully`
    });
    
    // Navigate to editor
    router.push(`/editor?project=${project.id}`);
  } catch (error) {
    notify({
      type: 'error',
      title: 'Project Creation Failed',
      message: error.message || 'Failed to create project'
    });
  } finally {
    isCreatingProject.value = false;
  }
};

// Open project
const openProject = (project) => {
  projectStore.setCurrentProject(project);
  router.push(`/editor?project=${project.id}`);
};

// Open playground
const openPlayground = () => {
  router.push('/editor');
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

// Load projects on mount
onMounted(async () => {
  try {
    await projectStore.fetchProjects();
  } catch (error) {
    notify({
      type: 'error',
      title: 'Load Failed',
      message: 'Failed to load projects'
    });
  }
});
</script>