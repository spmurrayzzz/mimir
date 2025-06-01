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
      <select
        :id="id"
        :value="modelValue"
        :disabled="disabled"
        :class="[
          'flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-10',
          'text-sm ring-offset-background',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-destructive ring-destructive' : '',
          className
        ]"
        @change="$emit('update:modelValue', $event.target.value)"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <slot></slot>
      </select>
      <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <svg
          class="h-4 w-4 text-muted-foreground"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
      <div v-if="error" class="mt-1 text-sm text-destructive">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  /**
   * Model value for v-model binding
   */
  modelValue: {
    type: [String, Number],
    default: ''
  },
  /**
   * Select label
   */
  label: {
    type: String,
    default: ''
  },
  /**
   * Select placeholder
   */
  placeholder: {
    type: String,
    default: ''
  },
  /**
   * Unique ID for the select
   */
  id: {
    type: String,
    default: () => `select-${Math.random().toString(36).substr(2, 9)}`
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
</script>