import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import { join } from 'path';

export default defineConfig({
  plugins: [
    vue(),
    // electron([
    //   {
    //     // Main process entry
    //     entry: 'src/main/index.js',
    //     vite: {
    //       build: {
    //         outDir: '.vite/build',
    //         rollupOptions: {
    //           external: ['electron'],
    //         },
    //       },
    //     },
    //   },
    //   {
    //     // Preload scripts
    //     entry: 'electron/preload.js',
    //     vite: {
    //       build: {
    //         outDir: '.vite/build',
    //       },
    //     },
    //   },
    // ]),
    // renderer(),
  ],
  resolve: {
    alias: {
      '@': join(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  },
});
