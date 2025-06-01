<template>
  <div class="flex flex-col h-full bg-background border rounded-md overflow-hidden">
    <!-- Chat header -->
    <div class="p-4 border-b flex items-center justify-between bg-card">
      <div class="flex items-center">
        <div class="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground mr-2">
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
            <path d="m12 8-9.04 9.06a2.82 2.82 0 1 0 3.98 3.98L16 12"/>
            <circle cx="17" cy="7" r="5"/>
          </svg>
        </div>
        <div>
          <h3 class="text-sm font-medium">{{ aiProvider.name }}</h3>
          <p class="text-xs text-muted-foreground">{{ aiProvider.model }}</p>
        </div>
      </div>
      
      <div class="flex items-center space-x-2">
        <button 
          @click="clearChat"
          class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-8 px-3 bg-secondary text-secondary-foreground hover:bg-secondary/80"
          title="Clear chat history"
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
            class="mr-1"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
          Clear
        </button>
        
        <button 
          @click="$emit('settings')"
          class="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          title="Chat settings"
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
    
    <!-- Messages container -->
    <div 
      ref="messagesContainer" 
      class="flex-1 overflow-y-auto p-4 space-y-4"
    >
      <div v-if="messages.length === 0" class="flex flex-col items-center justify-center h-full text-center p-6">
        <div class="rounded-full bg-muted p-3 mb-4">
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
            class="h-6 w-6 text-muted-foreground"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium">No messages yet</h3>
        <p class="text-muted-foreground mt-1 mb-4">
          Start a conversation with the AI assistant
        </p>
        <button 
          @click="focusInput"
          class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Start conversation
        </button>
      </div>
      
      <template v-else>
        <MessageBubble
          v-for="(msg, index) in messages"
          :key="index"
          :message="msg"
          :ai-provider-name="aiProvider.name"
        />
      </template>
      
      <!-- Typing indicator -->
      <TypingIndicator 
        v-if="isLoading"
        :message="loadingMessage"
        :show-cancel="true"
        @cancel="$emit('cancel')"
      />
    </div>
    
    <!-- Code actions -->
    <ActionButtons
      v-if="latestCodeMessage"
      v-model="autoApplyCode"
      :has-code="!!latestCodeMessage"
      :disabled="isLoading"
      @apply="$emit('apply-code', latestCodeMessage)"
      @modify="$emit('modify-code', latestCodeMessage)"
      @reject="$emit('reject-code', latestCodeMessage)"
      @settings="$emit('code-settings')"
    />
    
    <!-- Token usage -->
    <TokenUsage
      :input-tokens="tokenCounts.input"
      :output-tokens="tokenCounts.output"
      :max-tokens="tokenCounts.max"
      :cost="tokenCounts.cost"
      :duration="responseTime"
      :model-name="aiProvider.model"
    />
    
    <!-- Chat input -->
    <ChatInput
      ref="chatInputRef"
      v-model="inputMessage"
      :disabled="isLoading"
      :is-loading="isLoading"
      @submit="handleSubmit"
      @attach="handleAttach"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import MessageBubble from './MessageBubble.vue';
import ChatInput from './ChatInput.vue';
import TypingIndicator from './TypingIndicator.vue';
import TokenUsage from './TokenUsage.vue';
import ActionButtons from './ActionButtons.vue';

const props = defineProps({
  /**
   * Messages array
   */
  messages: {
    type: Array,
    default: () => []
  },
  /**
   * AI provider information
   */
  aiProvider: {
    type: Object,
    default: () => ({
      name: 'AI Assistant',
      model: 'Default Model'
    })
  },
  /**
   * Whether the AI is generating a response
   */
  isLoading: {
    type: Boolean,
    default: false
  },
  /**
   * Loading state message
   */
  loadingMessage: {
    type: String,
    default: 'Thinking...'
  },
  /**
   * Token usage information
   */
  tokenCounts: {
    type: Object,
    default: () => ({
      input: 0,
      output: 0,
      max: 0,
      cost: 0
    })
  },
  /**
   * Response time in milliseconds
   */
  responseTime: {
    type: Number,
    default: 0
  },
  /**
   * Whether to auto-apply code
   */
  autoApply: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'submit', 
  'cancel', 
  'clear', 
  'apply-code', 
  'modify-code', 
  'reject-code',
  'code-settings',
  'settings',
  'update:auto-apply',
  'attach'
]);

// Refs
const inputMessage = ref('');
const messagesContainer = ref(null);
const chatInputRef = ref(null);
const autoApplyCode = ref(props.autoApply);

// Watch for changes to autoApply prop
watch(() => props.autoApply, (newVal) => {
  autoApplyCode.value = newVal;
});

// Watch for changes to autoApplyCode
watch(autoApplyCode, (newVal) => {
  emit('update:auto-apply', newVal);
});

// Watch for new messages to scroll to bottom
watch(() => props.messages.length, () => {
  scrollToBottom();
});

// Get the latest code message
const latestCodeMessage = computed(() => {
  // Search in reverse to find the most recent code message
  for (let i = props.messages.length - 1; i >= 0; i--) {
    const msg = props.messages[i];
    if (msg.role === 'assistant' && (msg.type === 'code' || msg.language)) {
      return msg;
    }
  }
  return null;
});

// Handle submit from chat input
const handleSubmit = (data) => {
  if (!data.text.trim() && !data.attachments.length) return;
  
  emit('submit', {
    text: data.text.trim(),
    attachments: data.attachments
  });
  
  // Clear input
  inputMessage.value = '';
};

// Handle file attachment
const handleAttach = (data) => {
  emit('attach', data);
};

// Scroll messages container to bottom
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

// Focus the chat input
const focusInput = () => {
  chatInputRef.value?.focus();
};

// Clear chat history
const clearChat = () => {
  emit('clear');
};

// Initial scroll and focus
onMounted(() => {
  scrollToBottom();
  focusInput();
});

// Expose methods to parent
defineExpose({
  focusInput,
  scrollToBottom
});
</script>