<template>
  <footer class="border-t bg-card py-2 px-4 text-sm text-muted-foreground">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <!-- Status indicator -->
        <div class="flex items-center">
          <div 
            class="h-2 w-2 rounded-full mr-2" 
            :class="statusColor"
          ></div>
          <span>{{ statusText }}</span>
        </div>
        
        <!-- Current file -->
        <div v-if="currentFile" class="hidden md:flex items-center">
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
            class="mr-1 h-4 w-4"
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span class="truncate max-w-[200px]">{{ currentFile }}</span>
        </div>
        
        <!-- Project name -->
        <div v-if="projectName" class="hidden md:flex items-center">
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
            class="mr-1 h-4 w-4"
          >
            <path d="M3 3v18h18" />
            <path d="m19 9-5-5-4 4-3-3" />
          </svg>
          <span>{{ projectName }}</span>
        </div>
      </div>
      
      <div class="flex items-center space-x-4">
        <!-- AI model -->
        <div class="hidden md:flex items-center">
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
            class="mr-1 h-4 w-4"
          >
            <path d="m12 8-9.04 9.06a2.82 2.82 0 1 0 3.98 3.98L16 12" />
            <circle cx="17" cy="7" r="5" />
          </svg>
          <span>{{ aiModel }}</span>
        </div>
        
        <!-- Language -->
        <div v-if="language" class="flex items-center">
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
            class="mr-1 h-4 w-4"
          >
            <path d="m18 16 4-4-4-4" />
            <path d="m6 8-4 4 4 4" />
            <path d="m14.5 4-5 16" />
          </svg>
          <span>{{ language }}</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  /**
   * Current application status
   * Possible values: 'online', 'offline', 'loading', 'error'
   */
  status: {
    type: String,
    default: 'online'
  },
  /**
   * Current file being edited
   */
  currentFile: {
    type: String,
    default: ''
  },
  /**
   * Current project name
   */
  projectName: {
    type: String,
    default: ''
  },
  /**
   * Current AI model being used
   */
  aiModel: {
    type: String,
    default: 'OpenAI'
  },
  /**
   * Programming language of current file
   */
  language: {
    type: String,
    default: ''
  }
});

// Computed status color based on status prop
const statusColor = computed(() => {
  switch (props.status) {
    case 'online':
      return 'bg-green-500';
    case 'offline':
      return 'bg-gray-500';
    case 'loading':
      return 'bg-yellow-500';
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-green-500';
  }
});

// Computed status text based on status prop
const statusText = computed(() => {
  switch (props.status) {
    case 'online':
      return 'Ready';
    case 'offline':
      return 'Disconnected';
    case 'loading':
      return 'Processing...';
    case 'error':
      return 'Error';
    default:
      return 'Ready';
  }
});
</script>