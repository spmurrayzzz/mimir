import { createRouter, createWebHashHistory } from 'vue-router'
import { useProjectStore } from '../stores/projectStore'
import { useNotifications } from '../composables/useNotifications'

// Define routes with enhanced metadata
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
    meta: {
      title: 'Home - Mimir',
      requiresProject: false,
      icon: 'home',
      showInNav: true
    }
  },
  {
    path: '/editor',
    name: 'Editor',
    component: () => import('../views/EditorView.vue'),
    meta: {
      title: 'Editor - Mimir',
      requiresProject: true,
      icon: 'code',
      showInNav: true
    }
  },
  {
    path: '/projects',
    name: 'Projects',
    component: () => import('../views/ProjectsView.vue'),
    meta: {
      title: 'Projects - Mimir',
      requiresProject: false,
      icon: 'folder',
      showInNav: true
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/SettingsView.vue'),
    meta: {
      title: 'Settings - Mimir',
      requiresProject: false,
      icon: 'settings',
      showInNav: true
    }
  },
  // 404 page
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFoundView.vue'),
    meta: {
      title: 'Page Not Found - Mimir',
      requiresProject: false,
      showInNav: false
    }
  }
]

// Create router instance with improved scroll behavior
const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // If there's a saved position (when using back/forward navigation)
    if (savedPosition) {
      return savedPosition
    }
    // When navigating to a new route, scroll to top
    return { top: 0 }
  }
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  // Set document title based on route meta
  document.title = to.meta.title || 'Mimir - AI-Powered Code Editor'
  
  try {
    // Check if route requires a selected project
    if (to.meta.requiresProject) {
      const projectStore = useProjectStore()
      const currentProject = projectStore.currentProject
      
      // If no project is currently loaded, check for project in query params
      if (!currentProject && to.query.project) {
        try {
          // Try to load the project by ID
          await projectStore.loadProject(to.query.project)
        } catch (error) {
          console.error('Failed to load project:', error)
          
          // Notify user about failed project load
          const { notify } = useNotifications()
          notify({
            type: 'error',
            title: 'Project Not Found',
            message: 'The requested project could not be loaded'
          })
          
          // Redirect to projects page
          next({ path: '/projects' })
          return
        }
      }
      
      // If still no project is loaded, redirect to projects page
      if (!projectStore.currentProject) {
        // Redirect to projects page with return path
        next({
          path: '/projects',
          query: { returnTo: to.fullPath }
        })
        return
      }
    }
    
    // Continue to the requested route
    next()
  } catch (error) {
    console.error('Navigation guard error:', error)
    next()
  }
})

// After navigation analytics tracking
router.afterEach((to, from) => {
  // Track page views if analytics is enabled
  if (window.electronAPI && window.electronAPI.trackPageView) {
    window.electronAPI.trackPageView({
      path: to.path,
      name: to.name,
      query: to.query,
      timestamp: new Date().toISOString()
    }).catch(err => {
      console.error('Failed to track page view:', err)
    })
  }
})

export default router