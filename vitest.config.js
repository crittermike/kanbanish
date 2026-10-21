import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    pool: 'threads',
    maxWorkers: 4,
    minWorkers: 1,
    workspace: [
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/**/*.test.{js,jsx}'],
          exclude: ['src/{utils,data}/**']
        }
      },
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/{utils,data}/**/*.test.js']
        }
      }
    ],
    setupFiles: ['./src/setupTests.js'],
    exclude: ['e2e/**', 'node_modules/**'],
    reporters: ['default', 'json'],
    outputFile: 'vitest.results.json',
    coverage: {
      reporter: ['text', 'json', 'html']
    }
  }
});
