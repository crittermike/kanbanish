import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    reporters: ['default', 'json'],
    outputFile: 'vitest.results.json',
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
});
