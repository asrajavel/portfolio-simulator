import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/portfolio-simulator/',
  server: {
    sourcemapIgnoreList: false
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      }
    }
  },
  worker: {
    format: 'es'
  }
});