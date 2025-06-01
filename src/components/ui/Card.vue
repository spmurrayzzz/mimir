<template>
  <div
    :class="[
      'rounded-lg border bg-card text-card-foreground shadow-sm',
      className
    ]"
  >
    <div v-if="$slots.header" class="flex flex-col space-y-1.5 p-6">
      <slot name="header"></slot>
    </div>
    <div v-if="$slots.title || $slots.description" class="p-6 pt-0">
      <h3 v-if="$slots.title" class="text-2xl font-semibold leading-none tracking-tight">
        <slot name="title"></slot>
      </h3>
      <p v-if="$slots.description" class="text-sm text-muted-foreground">
        <slot name="description"></slot>
      </p>
    </div>
    <div :class="contentClass">
      <slot></slot>
    </div>
    <div v-if="$slots.footer" class="flex items-center p-6 pt-0">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  /**
   * Additional CSS classes for the card
   */
  className: {
    type: String,
    default: ''
  },
  /**
   * Whether to add padding to the content area
   */
  noPadding: {
    type: Boolean,
    default: false
  }
});

const contentClass = computed(() => props.noPadding ? '' : 'p-6 pt-0');
</script>