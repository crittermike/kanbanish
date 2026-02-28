import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    exclude: ['e2e/**', 'node_modules/**'],
    reporters: ['default', 'json'],
    outputFile: 'vitest.results.json',
    coverage: {
      reporter: ['text', 'json', 'html']
    }
  }
});
