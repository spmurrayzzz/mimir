<template>
  <div class="min-h-screen bg-background text-foreground antialiased">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue';
import { useTheme } from './composables/useTheme';
import { useSettingsStore } from './stores/settingsStore';

const { theme, setTheme } = useTheme();
const settingsStore = useSettingsStore();

// Initialize theme
onMounted(async () => {
  console.log('Mimir application mounted');
  
  try {
    // Load settings
    await settingsStore.loadSettings();
    
    // Apply theme from settings or default to system preference
    const savedTheme = settingsStore.ui?.theme || 'system';
    setTheme(savedTheme);
    
    // Apply dark class to document if needed
    if (theme.value === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme.value === 'light') {
      document.documentElement.classList.remove('dark');
    }
  } catch (error) {
    console.error('Failed to initialize theme:', error);
  }
});

// Watch for theme changes
watch(theme, (newTheme) => {
  if (newTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  // Save theme preference to settings
  if (settingsStore.ui) {
    settingsStore.ui.theme = newTheme;
    settingsStore.saveSettings().catch(console.error);
  }
});
</script>