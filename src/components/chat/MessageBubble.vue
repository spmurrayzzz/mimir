<template>
  <div 
    class="flex w-full mb-4" 
    :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
  >
    <div 
      class="max-w-[85%] rounded-lg px-4 py-3 shadow-sm"
      :class="[
        message.role === 'user' 
          ? 'bg-primary text-primary-foreground rounded-br-none' 
          : 'bg-secondary text-secondary-foreground rounded-bl-none'
      ]"
    >
      <div v-if="message.role !== 'user'" class="flex items-center mb-1">
        <div class="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground mr-2">
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
        <span class="text-xs font-medium">{{ aiProviderName }}</span>
      </div>
      
      <!-- Text content with proper formatting -->
      <div v-if="message.content" class="chat-message-content">
        <div v-if="contentType === 'text'" v-html="formattedContent"></div>
        
        <!-- Code block -->
        <div v-else-if="contentType === 'code'" class="bg-card rounded-md my-2 overflow-hidden">
          <div class="flex items-center justify-between py-1.5 px-4 bg-muted text-muted-foreground text-xs">
            <span>{{ message.language || 'code' }}</span>
            <button 
              class="hover:text-foreground"
              @click="copyCode"
              :title="copied ? 'Copied!' : 'Copy code'"
            >
              <svg v-if="!copied" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </button>
          </div>
          <pre class="p-4 overflow-x-auto text-sm"><code>{{ message.content }}</code></pre>
        </div>

        <!-- File link -->
        <div v-else-if="contentType === 'file'" class="flex items-center p-2 bg-card rounded-md">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <div class="flex-1 truncate">{{ message.filename || 'Attached file' }}</div>
          <button 
            class="ml-2 text-muted-foreground hover:text-foreground"
            @click="downloadFile"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Timestamp -->
      <div class="text-xs opacity-70 mt-1 text-right">
        {{ formattedTime }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

const props = defineProps({
  /**
   * Message object
   */
  message: {
    type: Object,
    required: true,
    validator: (obj) => {
      return obj.role && obj.content !== undefined && obj.timestamp;
    }
  },
  /**
   * AI provider name
   */
  aiProviderName: {
    type: String,
    default: 'AI Assistant'
  }
});

// Track copy state
const copied = ref(false);

// Helper function to format the message timestamp
const formattedTime = computed(() => {
  if (!props.message.timestamp) return '';
  
  const date = new Date(props.message.timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

// Determine content type (text, code, file)
const contentType = computed(() => {
  if (!props.message.content) return 'text';
  
  if (props.message.type === 'code' || props.message.language) {
    return 'code';
  }
  
  if (props.message.type === 'file' || props.message.filename) {
    return 'file';
  }
  
  return 'text';
});

// Format the content with markdown for text messages
const formattedContent = computed(() => {
  if (!props.message.content || contentType.value !== 'text') return '';
  
  // Convert markdown to HTML and sanitize
  const rawHTML = marked(props.message.content);
  return DOMPurify.sanitize(rawHTML);
});

// Copy code to clipboard
const copyCode = async () => {
  if (contentType.value !== 'code' || !props.message.content) return;
  
  try {
    await navigator.clipboard.writeText(props.message.content);
    copied.value = true;
    
    // Reset after 2 seconds
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy code:', err);
  }
};

// Download file (placeholder - would need actual implementation)
const downloadFile = () => {
  if (contentType.value !== 'file') return;
  
  // This would typically integrate with the Electron IPC to download the file
  console.log('Download file:', props.message.filename);
};
</script>

<style scoped>
.chat-message-content :deep(p) {
  margin-bottom: 0.5rem;
}

.chat-message-content :deep(p:last-child) {
  margin-bottom: 0;
}

.chat-message-content :deep(a) {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.chat-message-content :deep(ul), 
.chat-message-content :deep(ol) {
  margin-left: 1.5rem;
  margin-bottom: 0.5rem;
}

.chat-message-content :deep(li) {
  margin-bottom: 0.25rem;
}

.chat-message-content :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.9em;
}

.chat-message-content :deep(pre) {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>