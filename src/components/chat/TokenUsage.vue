<template>
  <div class="border-t p-2 text-xs text-muted-foreground bg-card">
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <div class="flex items-center mr-3">
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
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          <span>
            <span class="font-medium">{{ formattedDuration }}</span>
          </span>
        </div>
        
        <div class="flex items-center">
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
            <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5l6.74-6.76z"/>
            <line x1="16" y1="8" x2="2" y2="22"/>
            <line x1="17.5" y1="15" x2="9" y2="15"/>
          </svg>
          <span>
            <span class="font-medium">{{ totalTokens.toLocaleString() }}</span> tokens
          </span>
        </div>
      </div>
      
      <div class="flex items-center">
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
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span v-if="showCost" class="mr-1">
          Cost: <span class="font-medium">${{ formattedCost }}</span>
        </span>
        <span v-if="showModel">
          Model: <span class="font-medium">{{ modelName }}</span>
        </span>
      </div>
    </div>
    
    <!-- Token usage progress bar -->
    <div v-if="maxTokens > 0" class="mt-2">
      <div class="flex justify-between text-xs mb-1">
        <span>Usage</span>
        <span>{{ tokenPercentage }}% ({{ totalTokens.toLocaleString() }}/{{ maxTokens.toLocaleString() }})</span>
      </div>
      <div class="w-full bg-muted rounded-full h-1.5">
        <div 
          class="h-1.5 rounded-full" 
          :style="{ width: `${tokenPercentage}%` }"
          :class="[
            tokenPercentage < 70 ? 'bg-green-500' : 
            tokenPercentage < 90 ? 'bg-amber-500' : 'bg-red-500'
          ]"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  /**
   * Input tokens (from user)
   */
  inputTokens: {
    type: Number,
    default: 0
  },
  /**
   * Output tokens (from AI)
   */
  outputTokens: {
    type: Number,
    default: 0
  },
  /**
   * Maximum tokens allowed
   */
  maxTokens: {
    type: Number,
    default: 0
  },
  /**
   * Cost in USD
   */
  cost: {
    type: Number,
    default: 0
  },
  /**
   * Response duration in milliseconds
   */
  duration: {
    type: Number,
    default: 0
  },
  /**
   * AI model name
   */
  modelName: {
    type: String,
    default: ''
  },
  /**
   * Whether to show cost
   */
  showCost: {
    type: Boolean,
    default: true
  },
  /**
   * Whether to show model name
   */
  showModel: {
    type: Boolean,
    default: true
  }
});

// Computed properties
const totalTokens = computed(() => props.inputTokens + props.outputTokens);

const tokenPercentage = computed(() => {
  if (props.maxTokens <= 0) return 0;
  return Math.min(Math.round((totalTokens.value / props.maxTokens) * 100), 100);
});

const formattedCost = computed(() => {
  return props.cost.toFixed(4);
});

const formattedDuration = computed(() => {
  if (props.duration < 1000) {
    return `${props.duration}ms`;
  } else {
    return `${(props.duration / 1000).toFixed(1)}s`;
  }
});
</script>