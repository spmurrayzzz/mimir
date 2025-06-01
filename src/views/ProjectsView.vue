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
        <div class="container py-6">
          <!-- Page header -->
          <div class="flex items-center justify-between mb-6">
            <div>
              <h1 class="text-3xl font-bold">Projects</h1>
              <p class="text-muted-foreground">Manage your coding projects</p>
            </div>
            
            <button 
              @click="createNewProject"
              class="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
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
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              New Project
            </button>
          </div>
          
          <!-- Projects grid -->
          <div v-if="!isLoading && projects.length > 0" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card v-for="project in projects" :key="project.id" class="overflow-hidden">
              <template #header>
                <div class="flex items-center justify-between">
                  <h3 class="font-medium truncate">{{ project.name }}</h3>
                  <div class="relative">
                    <button 
                      @click="toggleProjectMenu(project.id)"
                      class="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="12" cy="5" r="1" />
                        <circle cx="12" cy="19" r="1" />
                      </svg>
                    </button>
                    
                    <!-- Project menu -->
                    <div 
                      v-if="activeMenu === project.id" 
                      class="absolute right-0 top-full mt-1 w-48 rounded-md border bg-popover p-1 shadow-md"
                      @click.stop
                    >
                      <button 
                        @click="renameProject(project)"
                        class="w-full flex items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground text-left"
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
                          class="mr-2"
                        >
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                        Rename
                      </button>
                      <button 
                        @click="duplicateProject(project)"
                        class="w-full flex items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground text-left"
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
                          class="mr-2"
                        >
                          <rect x="8" y="8" width="12" height="12" rx="2" />
                          <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                        </svg>
                        Duplicate
                      </button>
                      <button 
                        @click="exportProject(project)"
                        class="w-full flex items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground text-left"
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
                          class="mr-2"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" x2="12" y1="15" y2="3" />
                        </svg>
                        Export
                      </button>
                      <div class="h-px my-1 bg-muted"></div>
                      <button 
                        @click="confirmDeleteProject(project)"
                        class="w-full flex items-center rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground text-left"
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
                          class="mr-2"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </template>
              
              <div class="space-y-2">
                <p v-if="project.description" class="text-sm text-muted-foreground">
                  {{ project.description }}
                </p>
                
                <div class="flex items-center justify-between text-xs text-muted-foreground">
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
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="M3 9h18" />
                      <path d="M9 21V9" />
                    </svg>
                    {{ project.template || 'Custom' }}
                  </div>
                  
                  <div>
                    <span>Last updated: {{ formatDate(project.updatedAt) }}</span>
                  </div>
                </div>
              </div>
              
              <template #footer>
                <div class="flex space-x-2">
                  <button 
                    @click="openProject(project)"
                    class="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Open
                  </button>
                </div>
              </template>
            </Card>
          </div>
          
          <!-- Empty state -->
          <div v-else-if="!isLoading && projects.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
            <div class="rounded-full bg-muted p-3 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-6 w-6 text-muted-foreground"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            </div>
            <h3 class="text-lg font-medium">No projects yet</h3>
            <p class="text-muted-foreground mt-1 mb-4 max-w-md">
              Get started by creating your first project. You can create a new project from scratch or import an existing one.
            </p>
            <button 
              @click="createNewProject"
              class="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
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
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              Create Project
            </button>
          </div>
          
          <!-- Loading state -->
          <div v-else class="flex flex-col items-center justify-center py-12">
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
            <p class="mt-4 text-muted-foreground">Loading projects...</p>
          </div>
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
  
  <!-- Rename Project Dialog -->
  <Dialog v-model="renameProjectDialogOpen" title="Rename Project">
    <form @submit.prevent="submitRenameProject">
      <div>
        <label for="rename-project-name" class="block text-sm font-medium mb-1">New Project Name</label>
        <Input
          id="rename-project-name"
          v-model="editingProject.name"
          placeholder="Project Name"
          :error="validationErrors.editName"
          required
        />
      </div>
      
      <div class="mt-6 flex justify-end space-x-4">
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
          @click="renameProjectDialogOpen = false"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
          :disabled="isProcessing"
        >
          {{ isProcessing ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </form>
  </Dialog>
  
  <!-- Delete Confirmation Dialog -->
  <Dialog v-model="deleteConfirmDialogOpen" title="Delete Project">
    <p class="mb-4">
      Are you sure you want to delete <strong>{{ editingProject.name }}</strong>?
      This action cannot be undone.
    </p>
    
    <div class="mt-6 flex justify-end space-x-4">
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
        @click="deleteConfirmDialogOpen = false"
      >
        Cancel
      </button>
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
        :disabled="isProcessing"
        @click="deleteProject"
      >
        {{ isProcessing ? 'Deleting...' : 'Delete' }}
      </button>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
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
const isLoading = ref(true);
const isCreatingProject = ref(false);
const isProcessing = ref(false);
const activeMenu = ref(null);
const newProjectDialogOpen = ref(false);
const renameProjectDialogOpen = ref(false);
const deleteConfirmDialogOpen = ref(false);

const newProject = ref({
  name: '',
  description: '',
  template: 'empty'
});

const editingProject = ref({
  id: null,
  name: '',
  description: ''
});

const validationErrors = ref({
  name: '',
  template: '',
  editName: ''
});

// Computed properties
const projects = computed(() => {
  return projectStore.sortedProjects;
});

// Watch for store sidebar changes
watch(() => uiStore.sidebarOpen, (newValue) => {
  sidebarOpen.value = newValue;
});

// Toggle sidebar
const toggleSidebar = () => {
  uiStore.toggleSidebar();
};

// Close sidebar (mobile)
const closeSidebar = () => {
  uiStore.setSidebarOpen(false);
};

// Toggle project menu
const toggleProjectMenu = (projectId) => {
  if (activeMenu.value === projectId) {
    activeMenu.value = null;
  } else {
    activeMenu.value = projectId;
  }
};

// Close menu when clicking outside
const handleOutsideClick = (event) => {
  if (activeMenu.value !== null) {
    activeMenu.value = null;
  }
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
    template: '',
    editName: ''
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
    
    // Close dialog
    newProjectDialogOpen.value = false;
    
    // Notify success
    notify({
      type: 'success',
      title: 'Project Created',
      message: `Project "${project.name}" created successfully`
    });
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

// Rename project
const renameProject = (project) => {
  // Close menu
  activeMenu.value = null;
  
  // Set editing project
  editingProject.value = {
    id: project.id,
    name: project.name,
    description: project.description
  };
  
  // Reset validation errors
  validationErrors.value.editName = '';
  
  // Open dialog
  renameProjectDialogOpen.value = true;
};

// Submit rename project
const submitRenameProject = async () => {
  // Validate form
  if (!editingProject.value.name.trim()) {
    validationErrors.value.editName = 'Project name is required';
    return;
  }
  
  try {
    isProcessing.value = true;
    
    // Get the original project
    const project = projectStore.getProjectById(editingProject.value.id);
    if (!project) {
      throw new Error('Project not found');
    }
    
    // Update project
    const updatedProject = await projectStore.saveProject({
      ...project,
      name: editingProject.value.name,
      updatedAt: new Date().toISOString()
    });
    
    // Close dialog
    renameProjectDialogOpen.value = false;
    
    // Notify success
    notify({
      type: 'success',
      title: 'Project Renamed',
      message: `Project renamed to "${updatedProject.name}" successfully`
    });
  } catch (error) {
    notify({
      type: 'error',
      title: 'Rename Failed',
      message: error.message || 'Failed to rename project'
    });
  } finally {
    isProcessing.value = false;
  }
};

// Duplicate project
const duplicateProject = async (project) => {
  // Close menu
  activeMenu.value = null;
  
  try {
    isProcessing.value = true;
    
    // Create a copy of the project
    const newProject = await projectStore.saveProject({
      ...project,
      id: undefined, // Remove ID to create a new project
      name: `${project.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Notify success
    notify({
      type: 'success',
      title: 'Project Duplicated',
      message: `Project duplicated as "${newProject.name}" successfully`
    });
  } catch (error) {
    notify({
      type: 'error',
      title: 'Duplication Failed',
      message: error.message || 'Failed to duplicate project'
    });
  } finally {
    isProcessing.value = false;
  }
};

// Export project
const exportProject = (project) => {
  // Close menu
  activeMenu.value = null;
  
  // This would typically use the Electron IPC to export the project
  window.electronAPI.exportProject(project.id)
    .then((result) => {
      if (result.success) {
        notify({
          type: 'success',
          title: 'Project Exported',
          message: `Project exported to ${result.path}`
        });
      } else {
        throw new Error(result.error || 'Failed to export project');
      }
    })
    .catch((error) => {
      notify({
        type: 'error',
        title: 'Export Failed',
        message: error.message || 'Failed to export project'
      });
    });
};

// Confirm delete project
const confirmDeleteProject = (project) => {
  // Close menu
  activeMenu.value = null;
  
  // Set editing project
  editingProject.value = {
    id: project.id,
    name: project.name
  };
  
  // Open confirmation dialog
  deleteConfirmDialogOpen.value = true;
};

// Delete project
const deleteProject = async () => {
  try {
    isProcessing.value = true;
    
    // Delete project
    await projectStore.deleteProject(editingProject.value.id);
    
    // Close dialog
    deleteConfirmDialogOpen.value = false;
    
    // Notify success
    notify({
      type: 'success',
      title: 'Project Deleted',
      message: `Project "${editingProject.value.name}" deleted successfully`
    });
  } catch (error) {
    notify({
      type: 'error',
      title: 'Deletion Failed',
      message: error.message || 'Failed to delete project'
    });
  } finally {
    isProcessing.value = false;
  }
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
  } finally {
    isLoading.value = false;
  }
  
  // Add event listener for outside clicks
  document.addEventListener('click', handleOutsideClick);
});

// Cleanup on unmount
onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick);
});
</script>