<template>
  <div class="flex items-center space-x-2 px-4 py-3 bg-card rounded-lg shadow-sm mb-4">
    <div 
      class="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="18" 
        height="18" 
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
    
    <div class="typing-indicator">
      <span></span>
      <span></span>
      <span></span>
    </div>
    
    <div class="ml-2 text-sm text-muted-foreground">
      {{ message || 'Thinking...' }}
    </div>
    
    <button 
      v-if="showCancel"
      @click="$emit('cancel')"
      class="ml-auto inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 bg-secondary text-secondary-foreground hover:bg-secondary/80"
      type="button"
    >
      Cancel
    </button>
  </div>
</template>

<script setup>
defineProps({
  /**
   * Message to display alongside the typing indicator
   */
  message: {
    type: String,
    default: ''
  },
  /**
   * Show cancel button
   */
  showCancel: {
    type: Boolean,
    default: true
  }
});

defineEmits(['cancel']);
</script>

<style scoped>
.typing-indicator {
  display: flex;
  align-items: center;
}

.typing-indicator span {
  height: 8px;
  width: 8px;
  background-color: currentColor;
  border-radius: 50%;
  display: inline-block;
  margin-right: 3px;
  opacity: 0.6;
  animation: pulse 1.5s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
  margin-right: 0;
}

@keyframes pulse {
  0%, 60%, 100% {
    transform: scale(1);
    opacity: 0.6;
  }
  30% {
    transform: scale(1.3);
    opacity: 1;
  }
}
</style>