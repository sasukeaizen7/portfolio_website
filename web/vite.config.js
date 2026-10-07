import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // The lazy-loaded Galaxy chunk is mostly three.js (~250 kB gzipped); everything else is small.
  build: { chunkSizeWarningLimit: 1000 },
  server: {
    port: 5180,
    proxy: { '/api': 'http://localhost:3100' },
  },
});
