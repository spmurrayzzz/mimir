<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <Header />
    
    <!-- Main content area -->
    <div class="flex-1 flex items-center justify-center">
      <div class="max-w-md text-center p-8 bg-card rounded-lg shadow-md">
        <div class="mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="mx-auto text-muted-foreground"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
          </svg>
        </div>
        <h1 class="text-6xl font-bold mb-4">404</h1>
        <p class="text-xl mb-2">Page not found</p>
        <p class="text-muted-foreground mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            @click="$router.push('/')"
            class="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
          >
            Go Home
          </button>
          <button
            @click="$router.push('/projects')"
            class="px-6 py-3 border border-input bg-background rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            View Projects
          </button>
        </div>
      </div>
    </div>
    
    <!-- Status bar -->
    <StatusBar />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import Header from '../components/layout/Header.vue';
import StatusBar from '../components/layout/StatusBar.vue';

// Track the error event for analytics purposes
onMounted(() => {
  console.log('404 page accessed', {
    path: window.location.href,
    timestamp: new Date().toISOString()
  });
});
</script>