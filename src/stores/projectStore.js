import { defineStore } from 'pinia';

export const useProjectStore = defineStore('project', {
  state: () => ({
    projects: [],
    currentProject: null,
    isLoading: false,
    error: null
  }),
  
  getters: {
    getProjectById: (state) => (id) => {
      return state.projects.find(project => project.id === id);
    },
    
    sortedProjects: (state) => {
      return [...state.projects].sort((a, b) => b.updatedAt - a.updatedAt);
    }
  },
  
  actions: {
    async fetchProjects() {
      this.isLoading = true;
      this.error = null;
      
      try {
        const result = await window.electronAPI.getProjects();
        if (result.success) {
          this.projects = result.projects;
        } else {
          throw new Error(result.error || 'Failed to fetch projects');
        }
      } catch (error) {
        this.error = error.message;
        console.error('Error fetching projects:', error);
      } finally {
        this.isLoading = false;
      }
    },
    
    async saveProject(project) {
      this.isLoading = true;
      this.error = null;
      
      try {
        const result = await window.electronAPI.saveProject(project);
        if (result.success) {
          // Update or add the project
          const index = this.projects.findIndex(p => p.id === result.project.id);
          if (index >= 0) {
            this.projects[index] = result.project;
          } else {
            this.projects.push(result.project);
          }
          return result.project;
        } else {
          throw new Error(result.error || 'Failed to save project');
        }
      } catch (error) {
        this.error = error.message;
        console.error('Error saving project:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    
    setCurrentProject(project) {
      this.currentProject = project;
    }
  }
});