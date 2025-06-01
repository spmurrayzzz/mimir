<template>
  <div class="border-t bg-card p-4">
    <div class="relative">
      <!-- Main text input area -->
      <textarea
        ref="textareaRef"
        v-model="inputValue"
        rows="1"
        :placeholder="placeholder"
        :disabled="disabled || isLoading"
        class="w-full resize-none rounded-md border bg-background px-4 py-3 pr-14 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :class="[
          disabled || isLoading ? 'cursor-not-allowed opacity-50' : '',
          hasAttachments ? 'rounded-b-none border-b-0' : ''
        ]"
        @keydown.enter.prevent="handleEnterKey"
        @input="autoGrow"
      ></textarea>
      
      <!-- Send and attach buttons -->
      <div class="absolute bottom-2 right-2 flex space-x-1">
        <!-- Attach button -->
        <button
          type="button"
          :disabled="disabled || isLoading"
          class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-8 w-8 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          @click="handleAttach"
          :title="'Attach file'"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-5 w-5"
          >
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        
        <!-- Send button -->
        <button
          type="button"
          :disabled="!canSend || disabled || isLoading"
          class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-8 w-8"
          :class="canSend && !disabled && !isLoading ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-muted-foreground'"
          @click="handleSubmit"
          :title="'Send message'"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-5 w-5"
          >
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Attachments display -->
    <div
      v-if="hasAttachments"
      class="rounded-b-md border border-t-0 bg-background p-2 pt-1"
    >
      <div class="flex flex-wrap gap-2">
        <div
          v-for="(file, index) in attachments"
          :key="index"
          class="flex items-center rounded-md bg-muted px-2 py-1 text-xs"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="mr-1"
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span class="truncate max-w-[120px]">{{ file.name }}</span>
          <button
            type="button"
            class="ml-1 text-muted-foreground hover:text-foreground"
            @click="removeAttachment(index)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue';

const props = defineProps({
  /**
   * Input value (v-model)
   */
  modelValue: {
    type: String,
    default: ''
  },
  /**
   * Placeholder text
   */
  placeholder: {
    type: String,
    default: 'Type a message...'
  },
  /**
   * Whether the input is disabled
   */
  disabled: {
    type: Boolean,
    default: false
  },
  /**
   * Whether the AI is currently processing
   */
  isLoading: {
    type: Boolean,
    default: false
  },
  /**
   * Maximum height for the textarea
   */
  maxHeight: {
    type: Number,
    default: 200 // pixels
  }
});

const emit = defineEmits(['update:modelValue', 'submit', 'attach']);

// Refs
const textareaRef = ref(null);
const inputValue = ref(props.modelValue);
const attachments = ref([]);

// Computed
const hasAttachments = computed(() => attachments.value.length > 0);
const canSend = computed(() => inputValue.value.trim().length > 0 || hasAttachments.value);

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  inputValue.value = newValue;
});

// Watch for internal changes to inputValue
watch(inputValue, (newValue) => {
  emit('update:modelValue', newValue);
});

// Auto-resize textarea based on content
const autoGrow = () => {
  if (!textareaRef.value) return;
  
  // Reset height to get the correct scrollHeight
  textareaRef.value.style.height = 'auto';
  
  // Calculate new height
  const newHeight = Math.min(
    textareaRef.value.scrollHeight,
    props.maxHeight
  );
  
  // Apply the new height
  textareaRef.value.style.height = `${newHeight}px`;
};

// Handle submit button click
const handleSubmit = () => {
  if (!canSend.value || props.disabled || props.isLoading) return;
  
  emit('submit', {
    text: inputValue.value.trim(),
    attachments: [...attachments.value]
  });
  
  // Clear input and attachments
  inputValue.value = '';
  attachments.value = [];
  
  // Reset textarea height
  nextTick(() => {
    autoGrow();
    textareaRef.value?.focus();
  });
};

// Handle enter key press
const handleEnterKey = (event) => {
  // Submit on Enter, but allow Shift+Enter for new line
  if (!event.shiftKey) {
    handleSubmit();
  }
};

// Handle file attachments
const handleAttach = () => {
  if (props.disabled || props.isLoading) return;
  
  emit('attach', {
    // Callback to receive the selected files
    onSelect: (files) => {
      if (files && files.length) {
        attachments.value = [...attachments.value, ...files];
      }
    }
  });
};

// Remove an attachment
const removeAttachment = (index) => {
  attachments.value = attachments.value.filter((_, i) => i !== index);
};

// Initialize
onMounted(() => {
  // Set initial height
  nextTick(autoGrow);
  
  // Focus the textarea
  textareaRef.value?.focus();
});

// Expose methods to parent
defineExpose({
  focus: () => textareaRef.value?.focus(),
  clear: () => {
    inputValue.value = '';
    attachments.value = [];
    nextTick(autoGrow);
  }
});
</script>