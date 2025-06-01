<template>
  <Teleport to="body">
    <Transition
      enter-active-class="ease-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        @click="$emit('update:modelValue', false)"
      ></div>
    </Transition>

    <Transition
      enter-active-class="ease-out duration-300"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="ease-in duration-200"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
      >
        <div
          class="w-full max-w-lg rounded-lg bg-background p-6 shadow-lg"
          @click.stop
        >
          <div class="flex items-center justify-between">
            <h2 :id="titleId" class="text-lg font-semibold">
              <slot name="title">{{ title }}</slot>
            </h2>
            <button
              class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 w-9"
              @click="$emit('update:modelValue', false)"
              aria-label="Close dialog"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="mt-4">
            <slot></slot>
          </div>
          <div v-if="$slots.footer" class="mt-6 flex justify-end space-x-4">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { Teleport, Transition, onMounted, onUnmounted, watch, ref } from 'vue';

const props = defineProps({
  /**
   * Controls dialog visibility
   */
  modelValue: {
    type: Boolean,
    required: true
  },
  /**
   * Dialog title
   */
  title: {
    type: String,
    default: 'Dialog'
  }
});

defineEmits(['update:modelValue']);

// Generate unique ID for accessibility
const titleId = `dialog-title-${Math.random().toString(36).substring(2, 9)}`;

// Handle ESC key to close the dialog
const handleKeyDown = (event) => {
  if (event.key === 'Escape' && props.modelValue) {
    event.preventDefault();
    event.stopPropagation();
    // Close the dialog
    emit('update:modelValue', false);
  }
};

// Handle focus trap
const focusTrap = () => {
  // Add event listener for keydown
  document.addEventListener('keydown', handleKeyDown);
  
  // Store the active element before opening dialog
  const activeElement = document.activeElement;
  
  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
    // Return focus to the element that was active before the dialog was opened
    if (activeElement) activeElement.focus();
  };
};

// Watch for modelValue changes to handle focus trap
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    // Setup focus trap when dialog opens
    const cleanup = focusTrap();
    // Store cleanup function to be called on close
    onUnmounted(cleanup);
  }
});
</script>