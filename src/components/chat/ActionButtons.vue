<template>
  <div class="flex flex-col space-y-2 p-2 border-t bg-card">
    <div class="text-sm font-medium mb-1">Code Actions</div>
    
    <div class="flex space-x-2">
      <!-- Apply button -->
      <button
        @click="handleApply"
        :disabled="disabled || !hasCode"
        class="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 w-full"
        :class="[
          disabled || !hasCode 
            ? 'bg-muted text-muted-foreground cursor-not-allowed' 
            : 'bg-green-600 text-white hover:bg-green-700'
        ]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="mr-2"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
        Apply
      </button>
      
      <!-- Modify button -->
      <button
        @click="handleModify"
        :disabled="disabled || !hasCode"
        class="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 w-full"
        :class="[
          disabled || !hasCode 
            ? 'bg-muted text-muted-foreground cursor-not-allowed' 
            : 'bg-blue-600 text-white hover:bg-blue-700'
        ]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="mr-2"
        >
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
        Modify
      </button>
      
      <!-- Reject button -->
      <button
        @click="handleReject"
        :disabled="disabled || !hasCode"
        class="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 w-full"
        :class="[
          disabled || !hasCode 
            ? 'bg-muted text-muted-foreground cursor-not-allowed' 
            : 'bg-red-600 text-white hover:bg-red-700'
        ]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="mr-2"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        Reject
      </button>
    </div>
    
    <!-- Auto-apply toggle -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <input
          type="checkbox"
          :id="checkboxId"
          v-model="autoApply"
          :disabled="disabled"
          class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          @change="$emit('update:auto-apply', autoApply)"
        />
        <label :for="checkboxId" class="text-sm text-muted-foreground cursor-pointer">
          Auto-apply code changes
        </label>
      </div>
      
      <button
        v-if="showSettings"
        @click="$emit('settings')"
        class="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        title="Code application settings"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  /**
   * Whether there is code available for actions
   */
  hasCode: {
    type: Boolean,
    default: false
  },
  /**
   * Whether the component is disabled
   */
  disabled: {
    type: Boolean,
    default: false
  },
  /**
   * Whether auto-apply is enabled
   */
  modelValue: {
    type: Boolean,
    default: false
  },
  /**
   * Whether to show settings button
   */
  showSettings: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['apply', 'modify', 'reject', 'update:modelValue', 'settings']);

// Generate unique ID for checkbox
const checkboxId = `auto-apply-${Math.random().toString(36).substr(2, 9)}`;

// Two-way binding for auto-apply
const autoApply = ref(props.modelValue);

// Watch for changes in model value
watch(() => props.modelValue, (newValue) => {
  autoApply.value = newValue;
});

// Handler functions
const handleApply = () => {
  if (props.disabled || !props.hasCode) return;
  emit('apply');
};

const handleModify = () => {
  if (props.disabled || !props.hasCode) return;
  emit('modify');
};

const handleReject = () => {
  if (props.disabled || !props.hasCode) return;
  emit('reject');
};
</script>