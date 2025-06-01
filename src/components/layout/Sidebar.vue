<template>
  <div 
    class="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r bg-background transition-transform lg:translate-x-0"
    :class="{ '-translate-x-full': !isOpen }"
  >
    <div class="flex h-16 items-center border-b px-4">
      <router-link to="/" class="flex items-center space-x-2">
        <div class="flex items-center justify-center rounded-md bg-primary p-1 text-primary-foreground">
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
            class="h-5 w-5"
          >
            <path d="m18 16 4-4-4-4" />
            <path d="m6 8-4 4 4 4" />
            <path d="m14.5 4-5 16" />
          </svg>
        </div>
        <span class="text-xl font-bold tracking-tight">Mimir</span>
      </router-link>
      <button 
        class="ml-auto inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 text-muted-foreground hover:bg-accent hover:text-accent-foreground lg:hidden"
        @click="$emit('close')"
        aria-label="Close sidebar"
      >
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
          class="h-5 w-5"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    
    <div class="flex-1 overflow-auto py-4">
      <nav class="px-2 space-y-1">
        <div class="pb-2 mb-2 border-b">
          <h3 class="px-3 mb-2 text-sm font-semibold text-muted-foreground">Navigation</h3>
          <router-link
            v-for="item in navigation"
            :key="item.href"
            :to="item.href"
            class="flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
            :class="isActive(item.href) 
              ? 'bg-accent text-accent-foreground' 
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'"
          >
            <component 
              :is="item.icon" 
              class="mr-2 h-4 w-4" 
            />
            {{ item.label }}
          </router-link>
        </div>
        
        <div v-if="recentProjects.length > 0">
          <h3 class="px-3 mb-2 text-sm font-semibold text-muted-foreground">Recent Projects</h3>
          <router-link
            v-for="project in recentProjects"
            :key="project.id"
            :to="`/editor?project=${project.id}`"
            class="flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
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
              class="mr-2 h-4 w-4"
            >
              <path d="M3 3v18h18" />
              <path d="m19 9-5-5-4 4-3-3" />
            </svg>
            {{ project.name }}
          </router-link>
        </div>
      </nav>
    </div>
    
    <div class="border-t p-4">
      <div class="flex items-center">
        <div class="ml-3">
          <p class="text-sm font-medium">AI Provider</p>
          <p class="text-xs text-muted-foreground">{{ currentProvider }}</p>
        </div>
        <router-link 
          to="/settings" 
          class="ml-auto inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-8 w-8 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          aria-label="Settings"
        >
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
            class="h-4 w-4"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </router-link>
      </div>
    </div>
  </div>
  
  <!-- Overlay for mobile -->
  <Transition
    enter-active-class="transition-opacity ease-linear duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity ease-linear duration-300"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div 
      v-if="isOpen && !isDesktop" 
      class="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm lg:hidden"
      @click="$emit('close')"
    ></div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, h } from 'vue';
import { useRoute } from 'vue-router';
import { useProjectStore } from '../../stores/projectStore';

// Component props
const props = defineProps({
  /**
   * Controls whether the sidebar is open on mobile
   */
  isOpen: {
    type: Boolean,
    default: false
  }
});

// Emit events for sidebar control
defineEmits(['close']);

// Reactive references
const isDesktop = ref(false);

// Get recent projects from store
const projectStore = useProjectStore();
const recentProjects = computed(() => {
  return projectStore.sortedProjects.slice(0, 5);
});

// Navigation items with icons as render functions
const navigation = [
  { 
    label: 'Home', 
    href: '/',
    icon: {
      render() {
        return h('svg', {
          xmlns: 'http://www.w3.org/2000/svg',
          width: '24',
          height: '24',
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': '2',
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round'
        }, [
          h('path', { d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z' }),
          h('polyline', { points: '9 22 9 12 15 12 15 22' })
        ]);
      }
    }
  },
  { 
    label: 'Editor', 
    href: '/editor',
    icon: {
      render() {
        return h('svg', {
          xmlns: 'http://www.w3.org/2000/svg',
          width: '24',
          height: '24',
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': '2',
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round'
        }, [
          h('path', { d: 'm18 16 4-4-4-4' }),
          h('path', { d: 'm6 8-4 4 4 4' }),
          h('path', { d: 'm14.5 4-5 16' })
        ]);
      }
    }
  },
  { 
    label: 'Projects', 
    href: '/projects',
    icon: {
      render() {
        return h('svg', {
          xmlns: 'http://www.w3.org/2000/svg',
          width: '24',
          height: '24',
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': '2',
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round'
        }, [
          h('path', { d: 'M3 3v18h18' }),
          h('path', { d: 'm19 9-5-5-4 4-3-3' })
        ]);
      }
    }
  }
];

// Active route handling
const route = useRoute();
const isActive = (href) => {
  if (href === '/') {
    return route.path === '/';
  }
  return route.path.startsWith(href);
};

// Current AI provider (placeholder - will connect to actual store)
const currentProvider = ref('OpenAI');

// Handle window resize for responsive design
const handleResize = () => {
  isDesktop.value = window.innerWidth >= 1024; // lg breakpoint
};

onMounted(() => {
  handleResize();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});
</script>