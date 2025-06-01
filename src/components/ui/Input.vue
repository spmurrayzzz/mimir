<template>
  <div class="relative w-full">
    <label
      v-if="label"
      :for="id"
      class="block text-sm font-medium mb-2"
    >
      {{ label }}
    </label>
    <div class="relative">
      <input
        :id="id"
        ref="input"
        v-bind="$attrs"
        :type="type"
        :placeholder="placeholder"
        :value="modelValue"
        :disabled="disabled"
        :class="[
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2',
          'text-sm ring-offset-background placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-destructive ring-destructive' : '',
          className
        ]"
        @input="$emit('update:modelValue', $event.target.value)"
      />
      <div v-if="error" class="mt-1 text-sm text-destructive">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  /**
   * Model value for v-model binding
   */
  modelValue: {
    type: [String, Number],
    default: ''
  },
  /**
   * Input label
   */
  label: {
    type: String,
    default: ''
  },
  /**
   * Input type
   */
  type: {
    type: String,
    default: 'text'
  },
  /**
   * Input placeholder
   */
  placeholder: {
    type: String,
    default: ''
  },
  /**
   * Unique ID for the input
   */
  id: {
    type: String,
    default: () => `input-${Math.random().toString(36).substr(2, 9)}`
  },
  /**
   * Error message
   */
  error: {
    type: String,
    default: ''
  },
  /**
   * Disabled state
   */
  disabled: {
    type: Boolean,
    default: false
  },
  /**
   * Additional CSS classes
   */
  className: {
    type: String,
    default: ''
  }
});

defineEmits(['update:modelValue']);

const input = ref(null);

// Expose component methods to parent
defineExpose({
  focus: () => input.value?.focus(),
  blur: () => input.value?.blur()
});
</script>