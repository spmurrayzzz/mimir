<template>
  <main 
    class="flex-1 overflow-auto"
    :class="[
      isFullWidth ? 'w-full' : 'lg:pl-64',
      className
    ]"
  >
    <div 
      :class="[
        'h-full transition-all',
        contentClass
      ]"
    >
      <slot></slot>
    </div>
  </main>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  /**
   * Additional CSS classes for the main content area
   */
  className: {
    type: String,
    default: ''
  },
  /**
   * Whether the content should take full width (no sidebar space)
   */
  isFullWidth: {
    type: Boolean,
    default: false
  },
  /**
   * Whether to add padding to the content
   */
  noPadding: {
    type: Boolean,
    default: false
  }
});

// Computed content class based on padding preference
const contentClass = computed(() => props.noPadding ? '' : 'p-4 sm:p-6');
</script>