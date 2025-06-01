<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex flex-col items-end gap-2 px-4 py-6 sm:p-6 pointer-events-none"
      :class="[
        position === 'top-right' ? 'items-end justify-start' : '',
        position === 'top-left' ? 'items-start justify-start' : '',
        position === 'bottom-right' ? 'items-end justify-end' : '',
        position === 'bottom-left' ? 'items-start justify-end' : '',
        position === 'top-center' ? 'items-center justify-start' : '',
        position === 'bottom-center' ? 'items-center justify-end' : ''
      ]"
    >
      <TransitionGroup
        enter-active-class="transform ease-out duration-300 transition"
        enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
        enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
        leave-active-class="transition ease-in duration-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-for="toast in visibleToasts"
          :key="toast.id"
          class="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5"
          :class="[
            toastTypeClasses[toast.type] || toastTypeClasses.default,
            'pointer-events-auto'
          ]"
        >
          <div class="p-4">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <!-- Success icon -->
                <svg v-if="toast.type === 'success'" class="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <!-- Error icon -->
                <svg v-else-if="toast.type === 'error'" class="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <!-- Warning icon -->
                <svg v-else-if="toast.type === 'warning'" class="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <!-- Info icon -->
                <svg v-else class="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="ml-3 w-0 flex-1 pt-0.5">
                <p v-if="toast.title" class="text-sm font-medium text-foreground">{{ toast.title }}</p>
                <p class="mt-1 text-sm text-muted-foreground">{{ toast.message }}</p>
              </div>
              <div class="ml-4 flex flex-shrink-0">
                <button
                  type="button"
                  class="inline-flex rounded-md text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  @click="() => removeToast(toast.id)"
                >
                  <span class="sr-only">Close</span>
                  <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Progress bar for auto-dismiss -->
          <div 
            v-if="toast.duration && toast.duration > 0"
            class="h-1 bg-primary-foreground/10" 
            :style="{
              width: `${getProgressPercentage(toast)}%`,
              transition: 'width linear',
              transitionDuration: `${toast.duration}ms`
            }"
          ></div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { Teleport, TransitionGroup } from 'vue';

// Define props
const props = defineProps({
  /**
   * Position for the toast notifications
   */
  position: {
    type: String,
    default: 'bottom-right',
    validator: (value) => ['top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'].includes(value)
  },
  /**
   * Maximum number of toasts to show at once
   */
  maxToasts: {
    type: Number,
    default: 5
  }
});

// Toast type styling classes
const toastTypeClasses = {
  success: 'bg-background border border-green-200',
  error: 'bg-background border border-red-200',
  warning: 'bg-background border border-yellow-200',
  info: 'bg-background border border-blue-200',
  default: 'bg-background border border-gray-200'
};

// Internal toast state
const toasts = ref([]);
const toastTimeouts = ref(new Map());

// Visible toasts (limited by maxToasts)
const visibleToasts = computed(() => {
  return toasts.value.slice(0, props.maxToasts);
});

// Generate a unique ID for each toast
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Add a new toast
const addToast = (toast) => {
  const id = toast.id || generateId();
  const newToast = {
    id,
    title: toast.title || '',
    message: toast.message || '',
    type: toast.type || 'default',
    duration: toast.duration !== undefined ? toast.duration : 5000, // default 5 seconds
    createdAt: Date.now()
  };

  // Add the toast to the list
  toasts.value = [newToast, ...toasts.value];

  // If auto-dismiss is enabled, set a timeout
  if (newToast.duration && newToast.duration > 0) {
    const timeoutId = setTimeout(() => {
      removeToast(id);
    }, newToast.duration);
    
    toastTimeouts.value.set(id, timeoutId);
  }

  return id;
};

// Remove a toast by ID
const removeToast = (id) => {
  // Clear any existing timeout
  if (toastTimeouts.value.has(id)) {
    clearTimeout(toastTimeouts.value.get(id));
    toastTimeouts.value.delete(id);
  }
  
  // Remove the toast from the list
  toasts.value = toasts.value.filter(toast => toast.id !== id);
};

// Calculate progress percentage for toast auto-dismiss
const getProgressPercentage = (toast) => {
  if (!toast.duration || toast.duration <= 0) return 100;
  
  const elapsed = Date.now() - toast.createdAt;
  const remaining = Math.max(0, toast.duration - elapsed);
  return (remaining / toast.duration) * 100;
};

// Clean up any timeouts on component unmount
onUnmounted(() => {
  toastTimeouts.value.forEach(timeoutId => {
    clearTimeout(timeoutId);
  });
  toastTimeouts.value.clear();
});

// Expose methods to parent components
defineExpose({
  addToast,
  removeToast
});
</script>